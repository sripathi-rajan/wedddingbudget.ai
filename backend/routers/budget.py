from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from services.budget_engine import calculate_full_budget, run_pso_optimizer
from models.cost_tables import ARTIST_COSTS, SPECIALTY_COUNTER_COSTS
from database import get_db
from ml.rl_agent import get_rl_agent, BUDGET_CATEGORIES
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

class ConfigPayload(BaseModel):
    data: dict

class LogActualPayload(BaseModel):
    session_id: str
    category: str
    estimated: float
    actual: float

@router.post("/calculate")
def calculate_budget(payload: ConfigPayload):
    return calculate_full_budget(payload.data)

@router.post("/optimize")
def optimize_budget(payload: ConfigPayload):
    data = payload.data
    target = data.get("target_budget", 0)
    return run_pso_optimizer(data, target)

@router.post("/scenarios")
def get_scenarios(payload: ConfigPayload):
    base       = calculate_full_budget(payload.data)
    base_total = base["total"]
    base_items = base["items"]

    configs = [
        {"name": "Minimalist", "multiplier": 0.60,
         "description": "Simple & elegant — essentials only",
         "venue_type": "Open Lawn / Farm", "food_tier": "Budget", "hotel_tier": "3-star"},
        {"name": "Modest", "multiplier": 0.80,
         "description": "Balanced celebration",
         "venue_type": "Banquet Hall", "food_tier": "Standard", "hotel_tier": "4-star"},
        {"name": "Standard", "multiplier": 1.00,
         "description": "Full celebration as planned",
         "venue_type": payload.data.get("venue_type", "Banquet Hall"),
         "food_tier":  payload.data.get("food_budget_tier", "High"),
         "hotel_tier": payload.data.get("hotel_tier", "4-star")},
        {"name": "Luxury", "multiplier": 1.40,
         "description": "Grand affair — no compromises",
         "venue_type": "Palace / Heritage Hotel", "food_tier": "Luxury", "hotel_tier": "5-star"},
    ]

    result = {}
    for cfg in configs:
        m = cfg["multiplier"]
        scaled_items = {
            cat: {"low": round(v["low"] * m), "mid": round(v["mid"] * m), "high": round(v["high"] * m)}
            for cat, v in base_items.items()
        }
        result[cfg["name"]] = {
            "total": {
                "low":  round(base_total["low"]  * m),
                "mid":  round(base_total["mid"]  * m),
                "high": round(base_total["high"] * m),
            },
            "items":       scaled_items,
            "description": cfg["description"],
            "venue_type":  cfg["venue_type"],
            "food_tier":   cfg["food_tier"],
            "hotel_tier":  cfg["hotel_tier"],
        }
    return result

@router.get("/artists")
def get_artists():
    return {"artists": ARTIST_COSTS}

@router.get("/specialty-counters")
def get_counters():
    return {"counters": SPECIALTY_COUNTER_COSTS}

@router.post("/log-actual")
async def log_actual_cost(payload: LogActualPayload, db: AsyncSession = Depends(get_db)):
    """Log an actual spend to train the RL agent."""
    if payload.category not in BUDGET_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Unknown category. Must be one of: {BUDGET_CATEGORIES}")
    if payload.actual <= 0 or payload.estimated <= 0:
        raise HTTPException(status_code=400, detail="actual and estimated must be > 0")

    # Insert into budget_tracker table
    try:
        from models import BudgetTracker
        from sqlalchemy import insert
        await db.execute(
            insert(BudgetTracker).values(
                session_id = payload.session_id,
                category   = payload.category,
                estimated  = payload.estimated,
                actual     = payload.actual,
                difference = payload.actual - payload.estimated,
            )
        )
        await db.commit()
    except Exception:
        pass  # non-fatal

    agent  = get_rl_agent()
    result = await agent.update(payload.category, payload.estimated, payload.actual, db)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    accuracy_improvement = result.get("accuracy_delta", 0.0)
    sign = "+" if accuracy_improvement >= 0 else ""
    message = (
        f"Model updated! Accuracy changed by {sign}{accuracy_improvement:.1f}%"
        if accuracy_improvement != 0
        else "Model updated with new training sample"
    )

    return {
        "success":              True,
        "new_multiplier":       result["new_multiplier"],
        "accuracy_improvement": accuracy_improvement,
        "total_samples":        result["total_samples"],
        "message":              message,
    }


@router.get("/rl-stats")
async def get_rl_stats(db: AsyncSession = Depends(get_db)):
    """Return per-category accuracy stats + overall stats."""
    agent = get_rl_agent()
    stats = agent.get_stats()
    return stats


@router.get("/rl-multipliers")
async def get_rl_multipliers(db: AsyncSession = Depends(get_db)):
    """Admin view — return all current multipliers with training counts."""
    agent = get_rl_agent()
    mults  = agent.get_multipliers()
    counts = agent.training_counts
    return {
        "multipliers": {
            cat: {
                "multiplier":     round(mults.get(cat, 1.0), 4),
                "training_count": counts.get(cat, 0),
                "rl_adjusted":    abs(mults.get(cat, 1.0) - 1.0) > 0.05,
            }
            for cat in BUDGET_CATEGORIES
        }
    }


@router.post("/export-pdf")
def export_pdf(payload: ConfigPayload):
    """Generate a formatted PDF budget report."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        import io

        data = payload.data
        budget = calculate_full_budget(data)

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4,
            leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)

        styles = getSampleStyleSheet()
        gold   = colors.HexColor('#C9A84C')
        maroon = colors.HexColor('#6B1F2A')
        dark   = colors.HexColor('#2C2C2C')
        light  = colors.HexColor('#FDF8F0')
        gray   = colors.HexColor('#9A9A9A')

        title_style  = ParagraphStyle('T', fontName='Helvetica-Bold', fontSize=26, textColor=maroon, alignment=TA_CENTER, spaceAfter=4)
        sub_style    = ParagraphStyle('S', fontName='Helvetica', fontSize=12, textColor=gray, alignment=TA_CENTER, spaceAfter=20)
        h2_style     = ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=14, textColor=maroon, spaceBefore=14, spaceAfter=6)
        body_style   = ParagraphStyle('B', fontName='Helvetica', fontSize=10, textColor=dark, spaceAfter=4)
        note_style   = ParagraphStyle('N', fontName='Helvetica-Oblique', fontSize=9, textColor=gray, spaceAfter=12)

        def rupees(n):
            if not n: return '₹0'
            n = float(n)
            if n >= 10000000: return f'₹{n/10000000:.2f} Cr'
            if n >= 100000:   return f'₹{n/100000:.2f} L'
            if n >= 1000:     return f'₹{n/1000:.0f} K'
            return f'₹{int(n):,}'

        story = []

        # Header
        story.append(Paragraph("weddingbudget.AI", title_style))
        story.append(Paragraph("AI-Powered Wedding Budget Report", sub_style))
        story.append(HRFlowable(width="100%", thickness=2, color=gold))
        story.append(Spacer(1, 12))

        # Wedding info box
        wedding_type = data.get('wedding_type','—')
        city         = data.get('wedding_city','—')
        guests       = data.get('total_guests','—')
        date         = data.get('wedding_date','—')
        events       = ', '.join(data.get('events',[]) or ['—'])
        hotel        = data.get('hotel_tier','—')
        confidence   = f"{int((budget.get('confidence_score',0.72))*100)}%"

        info_data = [
            ['Wedding Type', wedding_type, 'City', city],
            ['Total Guests', str(guests), 'Date', date],
            ['Hotel Tier',   hotel, 'Events', events[:60]],
            ['AI Confidence', confidence, 'Outstation', str(data.get('outstation_guests','—'))],
        ]
        info_table = Table(info_data, colWidths=[3.5*cm, 5.5*cm, 3.5*cm, 5.5*cm])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), light),
            ('FONTNAME',   (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE',   (0,0), (-1,-1), 9),
            ('FONTNAME',   (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME',   (2,0), (2,-1), 'Helvetica-Bold'),
            ('TEXTCOLOR',  (0,0), (0,-1), maroon),
            ('TEXTCOLOR',  (2,0), (2,-1), maroon),
            ('GRID',       (0,0), (-1,-1), 0.5, colors.HexColor('#E8D5A3')),
            ('ROWBACKGROUNDS',(0,0),(-1,-1),[light, colors.white]),
            ('PADDING',    (0,0), (-1,-1), 6),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 20))

        # Total summary
        story.append(Paragraph("Budget Summary", h2_style))
        total = budget.get('total', {})
        summary_data = [
            ['Scenario', 'Amount', 'Description'],
            ['Conservative (Low)',  rupees(total.get('low')),  'Minimum realistic spend'],
            ['Most Likely (Mid)',   rupees(total.get('mid')),  'Best estimate with current selections'],
            ['Premium (High)',      rupees(total.get('high')), 'Maximum if all items upgraded'],
        ]
        sum_table = Table(summary_data, colWidths=[6*cm, 4*cm, 8*cm])
        sum_table.setStyle(TableStyle([
            ('BACKGROUND',  (0,0), (-1,0), maroon),
            ('TEXTCOLOR',   (0,0), (-1,0), colors.white),
            ('FONTNAME',    (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTNAME',    (0,1), (-1,-1), 'Helvetica'),
            ('FONTSIZE',    (0,0), (-1,-1), 10),
            ('BACKGROUND',  (0,2), (-1,2), colors.HexColor('#FFF8E8')),
            ('TEXTCOLOR',   (1,2), (1,2), colors.HexColor('#C9A84C')),
            ('FONTNAME',    (1,2), (1,2), 'Helvetica-Bold'),
            ('GRID',        (0,0), (-1,-1), 0.5, colors.HexColor('#E8D5A3')),
            ('PADDING',     (0,0), (-1,-1), 8),
            ('ALIGN',       (1,0), (1,-1), 'RIGHT'),
        ]))
        story.append(sum_table)
        story.append(Spacer(1, 20))

        # Itemised breakdown
        story.append(Paragraph("Itemised Breakdown", h2_style))
        items_data = [['Cost Head', 'Low', 'Mid (Est.)', 'High', 'Notes']]
        for name, vals in (budget.get('items') or {}).items():
            items_data.append([
                name,
                rupees(vals.get('low',0)),
                rupees(vals.get('mid',0)),
                rupees(vals.get('high',0)),
                (vals.get('note','') or '')[:45],
            ])
        # Total row
        items_data.append(['TOTAL',
            rupees(total.get('low')), rupees(total.get('mid')), rupees(total.get('high')), ''])

        items_table = Table(items_data, colWidths=[5.5*cm, 2.5*cm, 2.8*cm, 2.5*cm, 4.7*cm])
        n = len(items_data)
        items_table.setStyle(TableStyle([
            ('BACKGROUND',  (0,0),  (-1,0),   maroon),
            ('TEXTCOLOR',   (0,0),  (-1,0),   colors.white),
            ('FONTNAME',    (0,0),  (-1,0),   'Helvetica-Bold'),
            ('FONTSIZE',    (0,0),  (-1,-1),  9),
            ('FONTNAME',    (0,1),  (-1,-2),  'Helvetica'),
            ('FONTNAME',    (0,n-1),(-1,n-1), 'Helvetica-Bold'),
            ('BACKGROUND',  (0,n-1),(-1,n-1), colors.HexColor('#FFF8E8')),
            ('TEXTCOLOR',   (2,n-1),(2,n-1),  colors.HexColor('#C9A84C')),
            ('ROWBACKGROUNDS',(0,1),(-1,n-2),[colors.white, light]),
            ('GRID',        (0,0),  (-1,-1),  0.5, colors.HexColor('#E8D5A3')),
            ('PADDING',     (0,0),  (-1,-1),  6),
            ('ALIGN',       (1,0),  (3,-1),   'RIGHT'),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 20))

        # Footer
        story.append(HRFlowable(width="100%", thickness=1, color=gold))
        story.append(Spacer(1, 6))
        from datetime import datetime
        story.append(Paragraph(
            f"Generated by weddingbudget.AI | {datetime.now().strftime('%d %B %Y')} | AI Confidence: {confidence}",
            note_style))
        story.append(Paragraph(
            "This is an AI-estimated budget. Actual costs may vary. Always confirm with vendors.",
            note_style))

        doc.build(story)
        pdf_bytes = buf.getvalue()
        return Response(content=pdf_bytes, media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=WeddingBudget.pdf"})

    except ImportError:
        # ReportLab not installed — return plain text fallback
        data2 = payload.data
        budget2 = calculate_full_budget(data2)
        def r(n): return f"Rs.{int(float(n or 0)):,}"
        lines = ["WEDDINGBUDGET.AI — WEDDING BUDGET REPORT", "="*50,
                 f"Wedding Type: {data2.get('wedding_type','—')}",
                 f"City: {data2.get('wedding_city','—')}",
                 f"Guests: {data2.get('total_guests','—')}",
                 f"Events: {', '.join(data2.get('events',[]))}","",
                 "ITEMISED BUDGET","-"*50]
        for name, vals in (budget2.get('items') or {}).items():
            lines.append(f"{name:<32} Low:{r(vals['low']):<14} Mid:{r(vals['mid']):<14} High:{r(vals['high'])}")
        t = budget2.get('total',{})
        lines += ["", "TOTAL", f"  Low:  {r(t.get('low'))}", f"  Mid:  {r(t.get('mid'))}", f"  High: {r(t.get('high'))}"]
        return Response(content="\n".join(lines), media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=WeddingBudget.txt"})
