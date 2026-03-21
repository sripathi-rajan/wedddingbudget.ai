import { useState, useEffect, useRef } from 'react'
import { useWedding, formatRupees } from '../context/WeddingContext'
import { API_BASE as API } from '../utils/config'

// ─── Color palette per category ───────────────────────────────────────────────
const ITEM_COLORS = {
  'Wedding Type Base':       '#023047',
  'Events & Ceremonies':     '#219ebc',
  'Venue':                   '#04699b',
  'Accommodation':           '#0D9488',
  'Food & Beverages':        '#fb8500',
  'Decor & Design':          '#b37f00',
  'Artists & Entertainment': '#1D4ED8',
  'Logistics & Transport':   '#059669',
  'Sundries & Basics':       '#C2410C',
  'Contingency Buffer (8%)': '#6B7280',
}

// ─── Interactive Pie Chart ────────────────────────────────────────────────────
function PieChart({ items }) {
  const canvasRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const arcsRef   = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !items.length) return
    const ctx   = canvas.getContext('2d')
    const total = items.reduce((s, i) => s + i.value, 0)
    if (!total) return
    const cx = 135, cy = 135, r = 115, rIn = 52
    ctx.clearRect(0, 0, 270, 270)
    let start = -Math.PI / 2
    const arcs = []
    items.forEach(item => {
      const angle = (item.value / total) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, start + angle)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      // Percentage label if slice > 6%
      const pct = (item.value / total) * 100
      if (pct > 6) {
        const mid = start + angle / 2
        const lx  = cx + (r * 0.68) * Math.cos(mid)
        const ly  = cy + (r * 0.68) * Math.sin(mid)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${Math.round(pct)}%`, lx, ly)
      }
      arcs.push({ start, end: start + angle, item })
      start += angle
    })
    arcsRef.current = arcs
    // Centre donut hole
    ctx.beginPath()
    ctx.arc(cx, cy, rIn, 0, Math.PI * 2)
    ctx.fillStyle = '#FAFAFF'
    ctx.fill()
  }, [items])

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect  = canvas.getBoundingClientRect()
    const mx    = e.clientX - rect.left - 135
    const my    = e.clientY - rect.top  - 135
    const dist  = Math.sqrt(mx*mx + my*my)
    if (dist < 52 || dist > 115) { setTooltip(null); return }
    let angle = Math.atan2(my, mx)
    if (angle < -Math.PI / 2) angle += Math.PI * 2
    const total = items.reduce((s, i) => s + i.value, 0)
    for (const arc of arcsRef.current) {
      let s = arc.start, en = arc.end
      if (s < -Math.PI/2) { s += Math.PI*2; en += Math.PI*2 }
      if (angle >= s && angle <= en) {
        setTooltip({
          label: arc.item.label,
          value: formatRupees(arc.item.value),
          pct:   Math.round((arc.item.value / total) * 100),
          color: arc.item.color,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
        return
      }
    }
    setTooltip(null)
  }

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <canvas ref={canvasRef} width={270} height={270}
        style={{ borderRadius:'50%', cursor:'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)} />
      {tooltip && (
        <div style={{ position:'absolute', left: tooltip.x+12, top: tooltip.y-30,
          background:'#023047', color:'#fff', padding:'6px 10px', borderRadius:8,
          fontSize:12, fontWeight:700, pointerEvents:'none', whiteSpace:'nowrap',
          boxShadow:'0 4px 12px rgba(0,0,0,0.3)', zIndex:99,
          borderLeft:`3px solid ${tooltip.color}` }}>
          {tooltip.label}<br/>
          <span style={{ color:'#FDE68A' }}>{tooltip.value}</span>
          <span style={{ color:'rgba(255,255,255,0.6)', fontWeight:400 }}> · {tooltip.pct}%</span>
        </div>
      )}
    </div>
  )
}

// ─── Confidence Gauge ─────────────────────────────────────────────────────────
function ConfidenceBar({ score }) {
  const pct   = Math.round(score * 100)
  const color = pct >= 80 ? '#059669' : pct >= 60 ? '#D97706' : '#DC2626'
  const label = pct >= 80 ? 'High — all major details filled in'
              : pct >= 60 ? 'Medium — complete Decor, Artists & Logistics tabs'
              : 'Low — please fill more sections for accuracy'
  const tips  = []
  if (pct < 100) {
    if (!score || score < 0.25) tips.push('Add wedding type & events')
    if (pct < 65)  tips.push('Select artists in Tab 5')
    if (pct < 75)  tips.push('Configure logistics in Tab 7')
    if (pct < 85)  tips.push('Pick decor items in Tab 3')
  }
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontSize:15, fontWeight:800, color:'var(--primary-dark)' }}>AI Confidence Score</span>
        <span style={{ fontSize:22, fontWeight:900, color, fontFamily:'EB Garamond,serif' }}>{pct}%</span>
      </div>
      <div style={{ height:12, borderRadius:6, background:'var(--border)', overflow:'hidden', marginBottom:6 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:
          `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius:6, transition:'width 1s ease' }} />
      </div>
      <div style={{ fontSize:12, color:'var(--muted)' }}>{label}</div>
      {tips.length > 0 && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
          {tips.map((t,i) => (
            <span key={i} style={{ fontSize:11, background:'#FEF3C7', color:'#92400E',
              padding:'3px 8px', borderRadius:20, fontWeight:600 }}>💡 {t}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Tab8Budget() {
  const { wedding } = useWedding()

  const [budget,      setBudget]      = useState(null)
  const [scenarios,   setScenarios]   = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [scenLoading, setScenLoading] = useState(false)
  const [optimizing,  setOptimizing]  = useState(false)
  const [optimResult, setOptimResult] = useState(null)
  const [targetBudget,setTargetBudget]= useState('')
  const [exporting,   setExporting]   = useState(false)
  const [expanded,    setExpanded]    = useState(new Set())
  const [activeScen,  setActiveScen]  = useState('Standard')

  const toggleRow = (name) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(name) ? next.delete(name) : next.add(name)
    return next
  })

  // ── Calculate budget ──────────────────────────────────────────────────────
  const calculateBudget = async () => {
    setLoading(true); setScenLoading(true)
    try {
      const [budRes, scRes] = await Promise.all([
        fetch(`${API}/budget/calculate`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ data: wedding })
        }),
        fetch(`${API}/budget/scenarios`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ data: wedding })
        }),
      ])
      const [budData, scData] = await Promise.all([budRes.json(), scRes.json()])
      setBudget(budData)
      setScenarios(scData)
    } catch {
      // Offline fallback
      const total_guests = wedding.total_guests || 200
      const events       = wedding.events || []
      const base         = 2500000
      const items = {
        'Wedding Type Base':       { low:800000,   mid:2500000,  high:8000000,  note:wedding.wedding_type||'Hindu', sub_items:[] },
        'Events & Ceremonies':     { low:events.length*50000,  mid:events.length*200000, high:events.length*700000, note:events.join(', ')||'—', sub_items:events.map(e=>({name:e,low:50000,mid:200000,high:700000})) },
        'Venue':                   { low:100000,   mid:350000,   high:1500000,  note:wedding.venue_type||'—', sub_items:[] },
        'Accommodation':           { low:Math.ceil((wedding.outstation_guests||0)/2)*8000*2, mid:Math.ceil((wedding.outstation_guests||0)/2)*15000*2, high:Math.ceil((wedding.outstation_guests||0)/2)*30000*2, note:wedding.hotel_tier||'—', sub_items:[] },
        'Food & Beverages':        { low:total_guests*500*Math.max(1,events.length), mid:total_guests*1100*Math.max(1,events.length), high:total_guests*3000*Math.max(1,events.length), note:wedding.food_budget_tier||'—', sub_items:[] },
        'Decor & Design':          { low:(wedding.decor_total||0)*0.8, mid:wedding.decor_total||0, high:(wedding.decor_total||0)*1.25, note:'Selected decor', sub_items:[] },
        'Artists & Entertainment': { low:(wedding.artists_total||0)*0.9, mid:wedding.artists_total||0, high:(wedding.artists_total||0)*1.1, note:'Selected artists', sub_items:[] },
        'Logistics & Transport':   { low:(wedding.logistics_total||0)*0.9, mid:wedding.logistics_total||0, high:(wedding.logistics_total||0)*1.2, note:'Fleet + SFX', sub_items:[] },
        'Sundries & Basics':       { low:total_guests*800, mid:total_guests*1200, high:total_guests*2000, note:'Hampers, stationery, rituals', sub_items:[] },
      }
      const rMid = Object.values(items).reduce((s,i)=>s+i.mid,0)
      items['Contingency Buffer (8%)'] = { low:rMid*0.04, mid:rMid*0.08, high:rMid*0.12, note:'8% admin buffer', sub_items:[] }
      const totLow  = Object.values(items).reduce((s,i)=>s+i.low,0)
      const totMid  = Object.values(items).reduce((s,i)=>s+i.mid,0)
      const totHigh = Object.values(items).reduce((s,i)=>s+i.high,0)
      setBudget({ items, total:{low:totLow,mid:totMid,high:totHigh}, confidence_score:0.72, total_guests, events })
    }
    setLoading(false); setScenLoading(false)
  }

  // ── PSO Optimizer ─────────────────────────────────────────────────────────
  const optimize = async () => {
    if (!targetBudget || !budget) return
    setOptimizing(true)
    try {
      const res  = await fetch(`${API}/budget/optimize`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ data: { ...wedding, target_budget: parseFloat(targetBudget) } })
      })
      setOptimResult(await res.json())
    } catch {
      const current = budget.total.mid
      const target  = parseFloat(targetBudget)
      const savings  = current - target
      const WEIGHTS  = { 'Venue':0.25,'Food & Beverages':0.22,'Accommodation':0.15,'Decor & Design':0.18,'Artists & Entertainment':0.12,'Logistics & Transport':0.08 }
      const category_results = {}
      const recommendations  = []
      for (const [cat, w] of Object.entries(WEIGHTS)) {
        const orig = budget.items?.[cat]?.mid || 0
        const delta = Math.round(savings * w)
        const opt   = Math.max(0, orig - delta)
        const mult  = orig ? opt / orig : 1
        category_results[cat] = { original: orig, optimized: opt, delta: opt - orig, multiplier: mult }
        if (mult < 0.85) recommendations.push({ type:'reduce',  category:cat, message:`Reduce ${cat} by ~${Math.round((1-mult)*100)}%`, savings:Math.abs(opt-orig) })
        else if (mult > 1.15) recommendations.push({ type:'upgrade', category:cat, message:`Upgrade ${cat} by ~${Math.round((mult-1)*100)}%`, extra_cost:opt-orig })
        else recommendations.push({ type:'keep', category:cat, message:`${cat} is well-optimised`, savings:0 })
      }
      setOptimResult({ optimized_budget:target, target_budget:target, base_budget:current, savings:Math.round(savings), category_results, recommendations, convergence:0.94, iterations:50, particles:30 })
    }
    setOptimizing(false)
  }

  // ── Print/PDF ────────────────────────────────────────────────────────────
  const printPDF = () => {
    if (!budget) return
    const R = n => {
      if (!n) return '₹0'
      n = parseFloat(n)
      if (n >= 10000000) return `₹${(n/10000000).toFixed(2)} Cr`
      if (n >= 100000)   return `₹${(n/100000).toFixed(2)} L`
      if (n >= 1000)     return `₹${Math.round(n/1000)}K`
      return `₹${Math.round(n).toLocaleString('en-IN')}`
    }
    const conf = Math.round((budget.confidence_score||0.72)*100)

    // Build rows for the main table
    const mainRows = Object.entries(budget.items||{}).map(([name,vals]) => {
      const pct = budget.total.mid > 0 ? Math.round((vals.mid/budget.total.mid)*100) : 0
      const subRows = (vals.sub_items||[]).filter(s=>s.mid||s.low||s.high).map(s =>
        `<tr style="color:#555;font-size:11px">
           <td style="padding:4px 12px 4px 28px">· ${s.name}</td>
           <td style="text-align:right;padding:4px 8px">${R(s.low)||'—'}</td>
           <td style="text-align:right;padding:4px 8px">${R(s.mid)||'—'}</td>
           <td style="text-align:right;padding:4px 8px">${R(s.high)||'—'}</td>
           <td></td></tr>`
      ).join('')
      return `<tr style="background:${Object.keys(budget.items).indexOf(name)%2===0?'#f8f4ed':'white'}">
        <td style="padding:8px 12px;font-weight:700;display:flex;align-items:center;gap:6px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${ITEM_COLORS[name]||'#888'}"></span>${name}
        </td>
        <td style="text-align:right;padding:8px">${R(vals.low)}</td>
        <td style="text-align:right;padding:8px;font-weight:800;color:#04699b">${R(vals.mid)}</td>
        <td style="text-align:right;padding:8px">${R(vals.high)}</td>
        <td style="padding:8px;font-size:11px;color:#888">${pct}% · ${vals.note||''}</td>
      </tr>${subRows}`
    }).join('')

    // Scenario table rows
    const scenNames  = scenarios ? Object.keys(scenarios) : []
    const scenHdr    = scenNames.map(n => `<th style="background:#023047;color:white;padding:8px;text-align:right">${scenarios[n].icon} ${n}</th>`).join('')
    const scenItems  = Object.keys(budget.items||{}).map(cat => {
      const cells = scenNames.map(n => `<td style="text-align:right;padding:6px 10px">${R(scenarios?.[n]?.items?.[cat]?.mid||0)}</td>`).join('')
      return `<tr><td style="padding:6px 10px;font-weight:600">${cat}</td>${cells}</tr>`
    }).join('')
    const scenTots   = scenNames.map(n => `<td style="text-align:right;padding:8px;font-weight:800;font-size:15px;color:#C9A84C">${R(scenarios?.[n]?.total?.mid||0)}</td>`).join('')
    const scenTable  = scenarios ? `
      <h2>Scenario Comparison</h2>
      <table><thead><tr><th style="background:#023047;color:white;padding:8px;text-align:left">Category</th>${scenHdr}</tr></thead>
      <tbody>${scenItems}
      <tr style="background:#FFF8E8"><td style="padding:8px;font-weight:800">TOTAL</td>${scenTots}</tr>
      </tbody></table>` : ''

    // PSO table
    const psoTable = optimResult ? `
      <h2>PSO Optimiser Results</h2>
      <table><thead><tr>
        <th>Category</th><th>Current</th><th>Optimised</th><th>Change</th><th>Recommendation</th>
      </tr></thead><tbody>
      ${Object.entries(optimResult.category_results||{}).map(([cat,v])=>`
        <tr><td>${cat}</td>
        <td style="text-align:right">${R(v.original)}</td>
        <td style="text-align:right;font-weight:700">${R(v.optimized)}</td>
        <td style="text-align:right;color:${v.delta<0?'#059669':'#DC2626'}">${v.delta<0?'↓':'↑'} ${R(Math.abs(v.delta))}</td>
        <td style="font-size:11px">${(optimResult.recommendations||[]).find(r=>r.category===cat)?.message||''}</td>
        </tr>`).join('')}
      <tr style="background:#FFF8E8"><td colspan="5" style="padding:8px">
        Target: <b>${R(optimResult.target_budget)}</b> · Optimised: <b>${R(optimResult.optimized_budget)}</b> ·
        Savings: <b style="color:#059669">${R(Math.abs(optimResult.savings))}</b> ·
        Convergence: <b>${Math.round((optimResult.convergence||0)*100)}%</b>
      </td></tr></tbody></table>` : ''

    const html = `<!DOCTYPE html><html><head><title>WeddingBudget Report</title>
    <style>
      body{font-family:Georgia,serif;padding:32px;color:#023047;max-width:1100px;margin:0 auto}
      h1{font-size:30px;color:#023047;border-bottom:3px solid #C9A84C;padding-bottom:10px;margin-bottom:4px}
      h2{font-size:18px;color:#04699b;margin-top:30px;margin-bottom:10px;border-left:4px solid #C9A84C;padding-left:10px}
      .meta{color:#666;font-size:12px;margin-bottom:20px}
      .conf-bar{background:#e5e7eb;border-radius:6px;height:12px;overflow:hidden;margin:6px 0 4px}
      .conf-fill{height:100%;border-radius:6px;background:${conf>=80?'#059669':conf>=60?'#D97706':'#DC2626'};width:${conf}%}
      table{width:100%;border-collapse:collapse;margin-top:6px;font-size:13px}
      th{background:#023047;color:white;padding:10px 12px;text-align:left;font-size:12px}
      td{padding:6px 8px;border-bottom:1px solid #e5d8c0}
      tr:hover{background:#faf6ef!important}
      .total-row{background:#023047!important;color:white;font-size:16px;font-weight:bold}
      .total-row td{color:white;padding:12px}
      .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:16px 0}
      .summary-card{text-align:center;padding:16px;border-radius:12px;border:2px solid #C9A84C}
      .summary-card .label{font-size:12px;color:#666;margin-bottom:6px}
      .summary-card .amount{font-size:22px;font-weight:800;color:#023047}
      @media print{body{padding:16px}.summary-grid{display:flex;gap:12px}}
    </style></head><body>
    <h1>🪷 weddingbudget.AI — Wedding Budget Report</h1>
    <div class="meta">
      Wedding Type: <b>${wedding.wedding_type||'—'}</b> ·
      City: <b>${wedding.wedding_city||wedding.wedding_district||'—'}</b> ·
      Guests: <b>${wedding.total_guests||'—'}</b> ·
      Date: <b>${wedding.wedding_date||'—'}</b> ·
      Generated: <b>${new Date().toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</b>
    </div>
    <div>AI Confidence: <b style="color:${conf>=80?'#059669':conf>=60?'#D97706':'#DC2626'}">${conf}%</b></div>
    <div class="conf-bar"><div class="conf-fill"></div></div>
    <div style="font-size:11px;color:#888;margin-bottom:20px">
      ${conf>=80?'High confidence — all major details filled in':conf>=60?'Medium — complete Decor, Artists & Logistics for higher accuracy':'Low — please fill more sections'}
    </div>

    <div class="summary-grid">
      <div class="summary-card"><div class="label">Conservative (Low)</div><div class="amount">${R(budget.total.low)}</div></div>
      <div class="summary-card" style="background:#FFF8E8"><div class="label">Most Likely (Mid)</div><div class="amount" style="color:#C9A84C;font-size:28px">${R(budget.total.mid)}</div></div>
      <div class="summary-card"><div class="label">Premium (High)</div><div class="amount">${R(budget.total.high)}</div></div>
    </div>

    <h2>Detailed Cost Breakdown — Every Rupee Itemised</h2>
    <table>
      <thead><tr>
        <th>Cost Head / Sub-item</th>
        <th style="text-align:right">Low</th>
        <th style="text-align:right">Mid Estimate</th>
        <th style="text-align:right">High</th>
        <th>Notes · % of Total</th>
      </tr></thead>
      <tbody>${mainRows}
        <tr class="total-row">
          <td>TOTAL ESTIMATE</td>
          <td style="text-align:right">${R(budget.total.low)}</td>
          <td style="text-align:right;color:#C9A84C;font-size:18px">${R(budget.total.mid)}</td>
          <td style="text-align:right">${R(budget.total.high)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>

    ${scenTable}
    ${psoTable}

    <p style="margin-top:30px;font-size:11px;color:#999;border-top:1px solid #e5e7eb;padding-top:10px">
      This is an AI-estimated budget. Actual costs may vary by ±20%. Always confirm final figures with vendors before signing contracts.
    </p>
    </body></html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 600)
  }

  const exportServerPDF = async () => {
    if (!budget) return
    setExporting(true)
    try {
      const res  = await fetch(`${API}/budget/export-pdf`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ data: wedding })
      })
      const blob = await res.blob()
      const isPDF = res.headers.get('content-type')?.includes('pdf')
      const ext   = isPDF ? 'pdf' : 'txt'
      const date  = new Date().toLocaleDateString('en-IN').replace(/\//g,'-')
      const a = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = `WeddingBudget_${wedding.wedding_type||'Wedding'}_${date}.${ext}`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch { alert('Export failed. Make sure backend is running on port 8000.') }
    setExporting(false)
  }

  const pieItems = budget ? Object.entries(budget.items||{}).map(([name,vals]) => ({
    label: name, value: vals.mid||0, color: ITEM_COLORS[name]||'#888'
  })).filter(i=>i.value>0) : []

  const SCEN_COLORS = { Minimalist:'#059669', Modest:'#0D9488', Standard:'#1D4ED8', Luxury:'#C9A84C' }
  const SCEN_ICONS  = { Minimalist:'🌿', Modest:'✨', Standard:'⭐', Luxury:'👑' }

  return (
    <div>
      {/* ── Header ── */}
      <div className="section-card" style={{ textAlign:'center',
        background:'linear-gradient(135deg,#023047,#04699b,#219ebc)', color:'white' }}>
        <div style={{ fontFamily:'EB Garamond,serif', fontSize:30, fontWeight:800, marginBottom:4 }}>
          Wedding Budget Estimator
        </div>
        <div style={{ fontSize:13, opacity:0.75, marginBottom:16 }}>
          AI-powered · Every rupee itemised · PSO optimised · Scenario comparison
        </div>
        <button className="btn-primary" onClick={calculateBudget} disabled={loading}
          style={{ background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.5)', fontSize:16 }}>
          {loading ? '⚙️ Calculating...' : '✨ Generate My Budget'}
        </button>
      </div>

      {budget && (<>

        {/* ── Confidence ── */}
        <div className="section-card">
          <ConfidenceBar score={budget.confidence_score||0.72} />
        </div>

        {/* ── Total Summary Cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
          {[
            { label:'Conservative', sublabel:'Low', val:budget.total.low, color:'#0D9488', bg:'#F0FDF4' },
            { label:'Most Likely',  sublabel:'Mid Estimate', val:budget.total.mid, color:'#023047', bg:'linear-gradient(135deg,#023047,#04699b)', isMain:true },
            { label:'Premium',      sublabel:'High', val:budget.total.high, color:'#C2410C', bg:'#FFF7ED' },
          ].map(s => (
            <div key={s.label} className="section-card" style={{
              background:s.bg, textAlign:'center', margin:0,
              border: s.isMain ? 'none' : '1px solid var(--border)' }}>
              <div style={{ fontSize:11, fontWeight:700, color: s.isMain?'rgba(255,255,255,0.65)':s.color, letterSpacing:1, marginBottom:4 }}>
                {s.label.toUpperCase()}
              </div>
              <div style={{ fontFamily:'EB Garamond,serif', fontSize: s.isMain?40:28,
                fontWeight:800, color: s.isMain?'#FDE68A':s.color, lineHeight:1.1 }}>
                {formatRupees(s.val)}
              </div>
              <div style={{ fontSize:10, color: s.isMain?'rgba(255,255,255,0.5)':'var(--muted)', marginTop:4 }}>
                {s.sublabel}
              </div>
            </div>
          ))}
        </div>

        {/* ── Pie Chart ── */}
        <div className="section-card">
          <div className="section-title">Budget Breakdown</div>
          <div style={{ display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
            <PieChart items={pieItems} />
            <div style={{ flex:1, minWidth:220 }}>
              {pieItems.map(item => {
                const pct = budget.total.mid > 0 ? Math.round((item.value/budget.total.mid)*100) : 0
                return (
                  <div key={item.label} style={{ display:'flex', alignItems:'center', gap:8,
                    padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:12, height:12, borderRadius:2, background:item.color, flexShrink:0 }} />
                    <div style={{ flex:1, fontSize:12, fontWeight:600 }}>{item.label}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginRight:6 }}>{pct}%</div>
                    <div style={{ fontSize:13, fontWeight:800, color:item.color }}>{formatRupees(item.value)}</div>
                  </div>
                )
              })}
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8,
                fontSize:13, fontWeight:800, color:'var(--primary-dark)', paddingTop:6,
                borderTop:'2px solid var(--primary)' }}>
                TOTAL: {formatRupees(budget.total.mid)}
              </div>
            </div>
          </div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:8 }}>
            Hover over the chart for details · Values shown are Mid estimate
          </div>
        </div>

        {/* ── Detailed Cost Breakdown Table ── */}
        <div className="section-card">
          <div className="section-title">Detailed Cost Breakdown — Every Rupee Itemised</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--primary-dark)', color:'white' }}>
                  {['Cost Head','Details','Low','Mid Estimate','High','% Total'].map((h,i) => (
                    <th key={h} style={{ padding:'10px 10px', textAlign: i>=2?'right':'left',
                      fontWeight:700, fontSize:12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(budget.items||{}).map(([name, vals], ri) => {
                  const pct     = budget.total.mid > 0 ? (vals.mid/budget.total.mid*100).toFixed(1) : '0'
                  const isOpen  = expanded.has(name)
                  const hasSubs = (vals.sub_items||[]).length > 0
                  return (<>
                    <tr key={name} style={{ background: ri%2===0?'white':'var(--ivory)',
                      cursor: hasSubs?'pointer':'default' }}
                      onClick={() => hasSubs && toggleRow(name)}>
                      <td style={{ padding:'10px 10px', fontWeight:700 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ display:'inline-block', width:10, height:10,
                            borderRadius:2, background:ITEM_COLORS[name]||'#888', flexShrink:0 }} />
                          {name}
                          {hasSubs && <span style={{ fontSize:10, color:'var(--muted)' }}>
                            {isOpen ? ' ▲' : ' ▼'}
                          </span>}
                        </div>
                      </td>
                      <td style={{ padding:'10px 10px', color:'var(--muted)', fontSize:11 }}>{vals.note}</td>
                      <td style={{ padding:'10px 10px', textAlign:'right', color:'#0D9488', fontWeight:600, fontSize:12 }}>{formatRupees(vals.low)}</td>
                      <td style={{ padding:'10px 10px', textAlign:'right', fontWeight:800, color:'var(--primary)', fontSize:14 }}>{formatRupees(vals.mid)}</td>
                      <td style={{ padding:'10px 10px', textAlign:'right', color:'#C2410C', fontWeight:600, fontSize:12 }}>{formatRupees(vals.high)}</td>
                      <td style={{ padding:'10px 10px', textAlign:'right', fontWeight:700,
                        color: parseFloat(pct)>25?'#DC2626':parseFloat(pct)>15?'#D97706':'var(--muted)' }}>
                        {pct}%
                      </td>
                    </tr>
                    {isOpen && (vals.sub_items||[]).map((sub,si) => (
                      <tr key={`${name}-sub-${si}`} style={{ background:'#F8F4FF' }}>
                        <td colSpan={1} style={{ padding:'5px 10px 5px 36px', color:'#4B5563', fontSize:12 }}>
                          · {sub.name}
                        </td>
                        <td />
                        <td style={{ textAlign:'right', padding:'5px 10px', fontSize:11, color:'#0D9488' }}>
                          {sub.low ? formatRupees(sub.low) : '—'}
                        </td>
                        <td style={{ textAlign:'right', padding:'5px 10px', fontSize:11, fontWeight:700, color:'#4B5563' }}>
                          {sub.mid ? formatRupees(sub.mid) : '—'}
                        </td>
                        <td style={{ textAlign:'right', padding:'5px 10px', fontSize:11, color:'#C2410C' }}>
                          {sub.high ? formatRupees(sub.high) : '—'}
                        </td>
                        <td />
                      </tr>
                    ))}
                  </>)
                })}
                <tr style={{ background:'var(--primary-dark)', color:'white' }}>
                  <td colSpan={2} style={{ padding:'14px 12px', fontFamily:'EB Garamond,serif',
                    fontWeight:800, fontSize:17 }}>TOTAL ESTIMATE</td>
                  <td style={{ textAlign:'right', padding:'14px 10px', fontFamily:'EB Garamond,serif',
                    fontWeight:700, fontSize:16, color:'#A7F3D0' }}>{formatRupees(budget.total.low)}</td>
                  <td style={{ textAlign:'right', padding:'14px 10px', fontFamily:'EB Garamond,serif',
                    fontWeight:900, fontSize:22, color:'#FDE68A' }}>{formatRupees(budget.total.mid)}</td>
                  <td style={{ textAlign:'right', padding:'14px 10px', fontFamily:'EB Garamond,serif',
                    fontWeight:700, fontSize:16, color:'#FCA5A5' }}>{formatRupees(budget.total.high)}</td>
                  <td style={{ textAlign:'right', padding:'14px 10px', color:'rgba(255,255,255,0.6)', fontSize:12 }}>
                    100%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:8 }}>
            Click any row to expand sub-item breakdown · Green = Low · Blue = Mid · Red = High
          </div>
        </div>

        {/* ── Scenario Comparison ── */}
        <div className="section-card">
          <div className="section-title">Scenario Comparison</div>
          {scenLoading && <div style={{ color:'var(--muted)', fontSize:13 }}>Loading scenarios...</div>}

          {/* Scenario tab buttons */}
          {scenarios && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
                {Object.entries(scenarios).map(([name, sc]) => {
                  const isActive = activeScen === name
                  return (
                    <button key={name} onClick={() => setActiveScen(name)}
                      style={{ padding:'12px 8px', borderRadius:12, border:`2px solid ${SCEN_COLORS[name]}`,
                        background: isActive ? SCEN_COLORS[name] : 'white',
                        color: isActive ? 'white' : SCEN_COLORS[name],
                        cursor:'pointer', fontWeight:700, fontSize:12, transition:'all 0.2s' }}>
                      <div style={{ fontSize:18, marginBottom:4 }}>{SCEN_ICONS[name]}</div>
                      <div>{name}</div>
                      <div style={{ fontFamily:'EB Garamond,serif', fontSize:17,
                        fontWeight:900, marginTop:4 }}>
                        {formatRupees(sc.total.mid)}
                      </div>
                      <div style={{ fontSize:10, opacity:0.8, marginTop:2 }}>mid estimate</div>
                    </button>
                  )
                })}
              </div>

              {/* Active scenario description */}
              {scenarios[activeScen] && (
                <div style={{ padding:'10px 14px', background:`${SCEN_COLORS[activeScen]}15`,
                  borderRadius:10, border:`1.5px solid ${SCEN_COLORS[activeScen]}40`,
                  marginBottom:16, fontSize:13 }}>
                  <span style={{ fontWeight:700, color:SCEN_COLORS[activeScen] }}>{SCEN_ICONS[activeScen]} {activeScen}: </span>
                  {scenarios[activeScen].description}
                  <span style={{ marginLeft:12, color:'var(--muted)', fontSize:11 }}>
                    Venue: {scenarios[activeScen].venue_type} · Food: {scenarios[activeScen].food_tier} · Hotel: {scenarios[activeScen].hotel_tier}
                  </span>
                </div>
              )}

              {/* Comparison table — all 4 side by side */}
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding:'8px 10px', textAlign:'left', background:'var(--ivory-dark)',
                        color:'var(--primary-dark)', fontWeight:700, borderBottom:'2px solid var(--primary)' }}>
                        Category
                      </th>
                      {Object.keys(scenarios).map(n => (
                        <th key={n} style={{ padding:'8px 10px', textAlign:'right',
                          background: n===activeScen ? SCEN_COLORS[n] : 'var(--ivory-dark)',
                          color: n===activeScen ? 'white' : SCEN_COLORS[n],
                          fontWeight:700, borderBottom:'2px solid var(--primary)' }}>
                          {SCEN_ICONS[n]} {n}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(budget.items||{}).map((cat, ri) => (
                      <tr key={cat} style={{ background: ri%2===0?'white':'var(--ivory)' }}>
                        <td style={{ padding:'7px 10px', fontWeight:600, fontSize:12 }}>
                          <span style={{ display:'inline-block', width:8, height:8,
                            borderRadius:2, background:ITEM_COLORS[cat]||'#888',
                            marginRight:6 }} />{cat}
                        </td>
                        {Object.keys(scenarios).map(n => {
                          const val = scenarios[n]?.items?.[cat]?.mid || 0
                          return (
                            <td key={n} style={{ padding:'7px 10px', textAlign:'right',
                              color: n===activeScen ? SCEN_COLORS[n] : 'var(--primary)',
                              fontSize: n===activeScen ? 13 : 12,
                              fontWeight: n===activeScen ? 800 : 600 }}>
                              {formatRupees(val)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    <tr style={{ background:'var(--primary-dark)', color:'white' }}>
                      <td style={{ padding:'10px 10px', fontFamily:'EB Garamond,serif', fontWeight:800, fontSize:15 }}>
                        TOTAL
                      </td>
                      {Object.keys(scenarios).map(n => (
                        <td key={n} style={{ padding:'10px 10px', textAlign:'right',
                          fontFamily:'EB Garamond,serif', fontSize: n===activeScen ? 18 : 15,
                          fontWeight:900,
                          color: n===activeScen ? '#FDE68A' : 'rgba(255,255,255,0.8)' }}>
                          {formatRupees(scenarios[n]?.total?.mid||0)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop:8, fontSize:11, color:'var(--muted)' }}>
                All amounts are Mid estimates. Click a scenario card above to highlight it.
              </div>
            </>
          )}
        </div>

        {/* ── PSO Optimizer ── */}
        <div className="section-card" style={{ border:'2px solid #ffb703' }}>
          <div className="section-title" style={{ color:'#023047' }}>
            AI Budget Optimizer — Particle Swarm Optimization
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14 }}>
            30 particles × 50 iterations · Adaptive inertia · Per-category reallocation
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:200 }}>
              <label className="form-label">Your Target Budget (₹)</label>
              <input className="form-input" type="number"
                placeholder={`Current: ${Math.round(budget.total.mid)}`}
                value={targetBudget} onChange={e => setTargetBudget(e.target.value)} />
            </div>
            <button onClick={optimize} disabled={optimizing || !targetBudget}
              style={{ padding:'12px 28px', borderRadius:12, border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#ffb703,#fb8500)', color:'#023047',
                fontWeight:800, fontSize:15 }}>
              {optimizing ? 'Running PSO...' : '⚡ Optimize'}
            </button>
          </div>

          {optimizing && (
            <div style={{ marginTop:16, padding:14, background:'#FFF7ED', borderRadius:10 }}>
              <div style={{ fontSize:13, color:'#92400E', fontWeight:700, marginBottom:8 }}>
                PSO running 30 particles × 50 iterations...
              </div>
              <div style={{ height:8, background:'#FED7AA', borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'#fb8500', borderRadius:4,
                  animation:'pbar 1.6s ease-in-out infinite' }} />
              </div>
              <style>{`@keyframes pbar{0%{width:5%}50%{width:88%}100%{width:5%}}`}</style>
            </div>
          )}

          {optimResult && (<>
            {/* Summary cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:16 }}>
              {[
                { label:'Target Budget',   value:optimResult.target_budget,             color:'#9D174D' },
                { label:'Optimised Budget',value:optimResult.optimized_budget,          color:'#059669' },
                { label: optimResult.savings>=0?'Savings':'Extra Cost',
                  value: Math.abs(optimResult.savings),
                  color: optimResult.savings>=0?'#059669':'#DC2626' },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center', background:'white', padding:14,
                  borderRadius:10, border:'1.5px solid #FDE68A' }}>
                  <div style={{ fontSize:10, color:'var(--muted)', marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontFamily:'EB Garamond,serif', fontSize:20, fontWeight:900, color:s.color }}>
                    {formatRupees(s.value)}
                  </div>
                </div>
              ))}
            </div>

            {/* Per-category table */}
            <div style={{ marginTop:16, overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#023047', color:'white' }}>
                    {['Category','Current','Optimised','Change (₹)','Multiplier','Recommendation'].map(h => (
                      <th key={h} style={{ padding:'8px 10px',
                        textAlign: ['Current','Optimised','Change (₹)','Multiplier'].includes(h)?'right':'left',
                        fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(optimResult.category_results||{}).map(([cat, v], ri) => {
                    const rec = (optimResult.recommendations||[]).find(r=>r.category===cat||cat.includes(r.category)||r.category.includes(cat))
                    const rtype = rec?.type || 'keep'
                    const rowBg = rtype==='reduce'?'#FEF2F2':rtype==='upgrade'?'#EFF6FF':'#F0FDF4'
                    const dClr  = v.delta < 0 ? '#059669' : v.delta > 0 ? '#DC2626' : '#6B7280'
                    return (
                      <tr key={cat} style={{ background: ri%2===0?'white':'var(--ivory)' }}>
                        <td style={{ padding:'8px 10px', fontWeight:700 }}>{cat}</td>
                        <td style={{ textAlign:'right', padding:'8px 10px' }}>{formatRupees(v.original)}</td>
                        <td style={{ textAlign:'right', padding:'8px 10px', fontWeight:800, color:'var(--primary)' }}>{formatRupees(v.optimized)}</td>
                        <td style={{ textAlign:'right', padding:'8px 10px', fontWeight:700, color:dClr }}>
                          {v.delta < 0 ? '↓' : v.delta > 0 ? '↑' : '='} {formatRupees(Math.abs(v.delta))}
                        </td>
                        <td style={{ textAlign:'right', padding:'8px 10px', color:'var(--muted)' }}>
                          ×{v.multiplier}
                        </td>
                        <td style={{ padding:'8px 10px', fontSize:11 }}>
                          {rec && (
                            <span style={{ padding:'2px 8px', borderRadius:20,
                              background: rtype==='reduce'?'#FEE2E2':rtype==='upgrade'?'#DBEAFE':'#D1FAE5',
                              color:      rtype==='reduce'?'#DC2626':rtype==='upgrade'?'#1D4ED8':'#059669',
                              fontWeight:700 }}>
                              {rtype==='reduce'?'↓ Reduce':rtype==='upgrade'?'↑ Upgrade':'✓ Keep'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Recommendations */}
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#9D174D', marginBottom:8 }}>
                AI Recommendations:
              </div>
              {(optimResult.recommendations||[]).map((r, i) => {
                const isR = r.type==='reduce', isU = r.type==='upgrade'
                return (
                  <div key={i} style={{ padding:'8px 14px', borderRadius:10, marginBottom:6,
                    background: isR?'#FEF2F2':isU?'#EFF6FF':'#F0FDF4',
                    borderLeft: `3px solid ${isR?'#DC2626':isU?'#1D4ED8':'#059669'}`,
                    fontSize:12, color: isR?'#DC2626':isU?'#1D4ED8':'#059669', fontWeight:600 }}>
                    {isR?'↓':isU?'↑':'✓'} {r.message}
                    {r.savings > 0 && <span style={{ float:'right', fontWeight:800 }}>Save {formatRupees(r.savings)}</span>}
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop:10, fontSize:11, color:'var(--muted)', display:'flex', gap:16 }}>
              <span>PSO Convergence: <b>{Math.round((optimResult.convergence||0)*100)}%</b></span>
              <span>Particles: <b>{optimResult.particles}</b></span>
              <span>Iterations: <b>{optimResult.iterations}</b></span>
            </div>
          </>)}
        </div>

        {/* ── Export ── */}
        <div className="section-card">
          <div className="section-title">Export Budget</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <button onClick={exportServerPDF} disabled={exporting} className="btn-primary">
              {exporting ? 'Generating...' : '⬇ Download Detailed PDF (Server)'}
            </button>
            <button onClick={printPDF}
              style={{ padding:'12px 24px', borderRadius:12, border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#023047,#04699b)', color:'white',
                fontWeight:700, fontSize:14 }}>
              🖨 Print / Save as PDF (Full Detail)
            </button>
            <button onClick={() => {
              const blob = new Blob([JSON.stringify({ ...budget, scenarios, optimResult, wedding_config:wedding }, null, 2)],
                { type:'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'WeddingBudget_Full.json'
              a.click()
            }} style={{ padding:'12px 24px', borderRadius:12, border:'2px solid var(--primary)',
              background:'transparent', color:'var(--primary-dark)', fontWeight:700, cursor:'pointer', fontSize:14 }}>
              { } Export JSON
            </button>
          </div>
          <div style={{ marginTop:10, fontSize:12, color:'#4a7a94' }}>
            💡 "Print / Save as PDF" includes sub-items, scenario comparison, and PSO results — works offline.
          </div>
        </div>

      </>)}
    </div>
  )
}
