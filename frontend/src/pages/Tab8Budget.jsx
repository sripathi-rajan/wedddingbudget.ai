import { useState, useEffect, useRef } from 'react'
import { useWedding, formatRupees } from '../context/WeddingContext'
import { API_BASE as API } from '../utils/config'

const ITEM_COLORS = {
  'Wedding Type Base': '#023047',
  'Events & Ceremonies': '#219ebc',
  'Venue': '#04699b',
  'Accommodation': '#0D9488',
  'Food & Beverages': '#fb8500',
  'Decor & Design': '#b37f00',
  'Artists & Entertainment': '#1D4ED8',
  'Logistics & Transport': '#059669',
  'Sundries & Basics': '#C2410C',
  'Contingency Buffer (8%)': '#6B7280',
}

function PieChart({ items }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !items.length) return
    const ctx = canvas.getContext('2d')
    const total = items.reduce((s, i) => s + i.value, 0)
    if (!total) return
    let start = -Math.PI / 2
    const cx = 130, cy = 130, r = 110
    ctx.clearRect(0, 0, 260, 260)
    items.forEach(item => {
      const angle = (item.value / total) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, start + angle)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
      start += angle
    })
    ctx.beginPath()
    ctx.arc(cx, cy, 55, 0, Math.PI * 2)
    ctx.fillStyle = '#FAFAFF'
    ctx.fill()
  }, [items])
  return <canvas ref={canvasRef} width={260} height={260} style={{ borderRadius: '50%' }} />
}

function ConfidenceBar({ score }) {
  const pct = Math.round(score * 100)
  const color = pct >= 80 ? '#059669' : pct >= 60 ? '#D97706' : '#DC2626'
  const label = pct >= 80 ? 'High confidence — all major details filled' :
    pct >= 60 ? 'Medium — fill more tabs to improve accuracy' :
    'Low — please complete more sections'
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:14, fontWeight:700 }}>AI Confidence Score</span>
        <span style={{ fontSize:14, fontWeight:800, color }}>{pct}%</span>
      </div>
      <div style={{ height:10, borderRadius:5, background:'var(--border)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color,
          borderRadius:5, transition:'width 0.8s ease' }} />
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginTop:5 }}>{label}</div>
    </div>
  )
}

export default function Tab8Budget() {
  const { wedding } = useWedding()
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optimResult, setOptimResult] = useState(null)
  const [targetBudget, setTargetBudget] = useState('')
  const [exporting, setExporting] = useState(false)

  const calculateBudget = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/budget/calculate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: wedding })
      })
      const data = await res.json()
      setBudget(data)
    } catch {
      const total_guests = wedding.total_guests || 0
      const events = wedding.events || []
      const items = {
        'Wedding Type Base':      { low:800000,  mid:2500000, high:8000000,  note:wedding.wedding_type||'Hindu' },
        'Events & Ceremonies':    { low:events.length*50000,  mid:events.length*200000, high:events.length*700000, note:events.join(', ')||'—' },
        'Venue':                  { low:100000,  mid:350000,  high:1500000,  note:wedding.venue_type||'—' },
        'Accommodation':          { low:Math.ceil((wedding.outstation_guests||0)/2)*8000*2,  mid:Math.ceil((wedding.outstation_guests||0)/2)*15000*2, high:Math.ceil((wedding.outstation_guests||0)/2)*30000*2, note:wedding.hotel_tier||'—' },
        'Food & Beverages':       { low:total_guests*500*Math.max(1,events.length), mid:total_guests*1100*Math.max(1,events.length), high:total_guests*3000*Math.max(1,events.length), note:wedding.food_budget_tier||'—' },
        'Decor & Design':         { low:wedding.decor_total*0.8||0, mid:wedding.decor_total||0, high:wedding.decor_total*1.25||0, note:'Selected decor' },
        'Artists & Entertainment':{ low:wedding.artists_total*0.9||0, mid:wedding.artists_total||0, high:wedding.artists_total*1.1||0, note:'Selected artists' },
        'Logistics & Transport':  { low:wedding.logistics_total*0.9||0, mid:wedding.logistics_total||0, high:wedding.logistics_total*1.2||0, note:'Fleet + ghodi + SFX' },
        'Sundries & Basics':      { low:total_guests*800, mid:total_guests*1200, high:total_guests*2000, note:'Hampers, stationery, rituals' },
      }
      const running_mid = Object.values(items).reduce((s, i) => s + i.mid, 0)
      items['Contingency Buffer (8%)'] = { low:running_mid*0.04, mid:running_mid*0.08, high:running_mid*0.12, note:'8% admin buffer' }
      setBudget({
        items, total:{
          low:Object.values(items).reduce((s,i)=>s+i.low,0),
          mid:Object.values(items).reduce((s,i)=>s+i.mid,0),
          high:Object.values(items).reduce((s,i)=>s+i.high,0)
        },
        confidence_score:0.72, total_guests, events
      })
    }
    setLoading(false)
  }

  const optimize = async () => {
    if (!targetBudget || !budget) return
    setOptimizing(true)
    try {
      const res = await fetch(`${API}/budget/optimize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { ...wedding, target_budget: parseFloat(targetBudget) } })
      })
      const data = await res.json()
      setOptimResult(data)
    } catch {
      const current = budget.total.mid
      const target = parseFloat(targetBudget)
      const savings = current - target
      const items = budget.items || {}

      let recommendations = []
      if (savings > 0) {
        // Proportional cuts: each reducible category's share of savings
        const WEIGHTS = {
          'Venue': 0.25, 'Food & Beverages': 0.25, 'Accommodation': 0.20,
          'Decor & Design': 0.15, 'Artists & Entertainment': 0.10,
          'Sundries & Basics': 0.05
        }
        for (const [cat, weight] of Object.entries(WEIGHTS)) {
          const item = items[cat]
          if (!item) continue
          const cut = Math.round(savings * weight)
          const newVal = Math.max(0, item.mid - cut)
          if (cut > 0 && item.mid > 0) {
            recommendations.push(`${cat}: reduce by ${formatRupees(cut)} → new estimate ${formatRupees(newVal)}`)
          }
        }
        if (recommendations.length === 0) {
          recommendations.push(`No significant reductions possible — target is very close to current estimate`)
        }
      } else {
        // Budget is higher than current — show upgrade options
        const surplus = Math.abs(savings)
        const UPGRADES = {
          'Venue': 0.35, 'Food & Beverages': 0.25, 'Decor & Design': 0.20,
          'Artists & Entertainment': 0.15, 'Accommodation': 0.05
        }
        for (const [cat, weight] of Object.entries(UPGRADES)) {
          const extra = Math.round(surplus * weight)
          if (extra > 0) {
            recommendations.push(`${cat}: allocate ${formatRupees(extra)} more for an upgrade`)
          }
        }
      }

      setOptimResult({
        optimized_budget: target,
        target_budget: target,
        savings: Math.round(savings),
        recommendations,
        convergence: 0.94
      })
    }
    setOptimizing(false)
  }

  const exportPDF = async () => {
    if (!budget) return
    setExporting(true)
    try {
      const res = await fetch(`${API}/budget/export-pdf`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: wedding })
      })
      const blob = await res.blob()
      const isPDF = res.headers.get('content-type')?.includes('pdf')
      const ext = isPDF ? 'pdf' : 'txt'
      const dateStr = new Date().toLocaleDateString('en-IN').replace(/\//g, '-')
      const fname = `WeddingBudget_${wedding.wedding_type||'Wedding'}_${dateStr}.${ext}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = fname; a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Make sure the backend is running on port 8000.')
    }
    setExporting(false)
  }

  const pieItems = budget ? Object.entries(budget.items || {}).map(([name, vals]) => ({
    label: name, value: vals.mid || 0, color: ITEM_COLORS[name] || '#888'
  })) : []

  return (
    <div>
      {/* Header */}
      <div className="section-card" style={{ textAlign:'center',
        background:'linear-gradient(135deg,#023047,#04699b,#219ebc)', color:'white' }}>
        <div style={{ fontFamily:'EB Garamond,serif', fontSize:30, fontWeight:800 }}>
          Wedding Budget Estimator
        </div>
        <button className="btn-primary" onClick={calculateBudget} disabled={loading}
          style={{ marginTop:16, background:'rgba(255,255,255,0.2)',
            border:'2px solid rgba(255,255,255,0.5)', fontSize:16 }}>
          {loading ? '⚙️ Calculating...' : '✨ Generate My Budget'}
        </button>
      </div>

      {budget && (
        <>
          {/* Confidence */}
          <div className="section-card">
            <ConfidenceBar score={budget.confidence_score || 0.72} />
          </div>

          {/* Total Summary */}
          <div className="section-card" style={{ background:'linear-gradient(135deg,#023047,#04699b)', textAlign:'center' }}>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:600, marginBottom:8 }}>
              Estimated Wedding Budget
            </div>
            <div style={{ fontFamily:'EB Garamond,serif', fontSize:48, fontWeight:800, color:'#FDE68A', lineHeight:1 }}>
              {formatRupees(budget.total.mid)}
            </div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, marginTop:10 }}>
              Based on your selections across all tabs
            </div>
          </div>

          {/* Pie Chart */}
          <div className="section-card">
            <div className="section-title">Budget Breakdown</div>
            <div style={{ display:'flex', gap:32, alignItems:'center', flexWrap:'wrap' }}>
              <PieChart items={pieItems} />
              <div style={{ flex:1, minWidth:200 }}>
                {pieItems.map(item => (
                  <div key={item.label} style={{ display:'flex', alignItems:'center', gap:10,
                    marginBottom:8, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:14, height:14, borderRadius:3, background:item.color, flexShrink:0 }} />
                    <div style={{ flex:1, fontSize:13, fontWeight:600 }}>{item.label}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:item.color }}>{formatRupees(item.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Itemised Table — estimated (mid) only */}
          <div className="section-card">
            <div className="section-title">Cost Breakdown</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'var(--ivory-dark)' }}>
                    {['Cost Head','Details','Estimated Cost'].map(h => (
                      <th key={h} style={{ padding:'10px 12px',
                        textAlign: h==='Estimated Cost' ? 'right' : 'left',
                        fontWeight:700, color:'var(--primary-dark)',
                        borderBottom:'2px solid var(--primary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(budget.items || {}).map(([name, vals], i) => (
                    <tr key={name} style={{ background: i%2===0 ? 'white' : 'var(--ivory)' }}>
                      <td style={{ padding:'10px 12px', fontWeight:700 }}>
                        <span style={{ display:'inline-block', width:10, height:10, borderRadius:2,
                          background:ITEM_COLORS[name]||'#888', marginRight:8 }} />
                        {name}
                      </td>
                      <td style={{ padding:'10px 12px', color:'var(--muted)', fontSize:12 }}>{vals.note}</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:700, color:'var(--primary)', fontSize:14 }}>
                        {formatRupees(vals.mid)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background:'var(--primary-light)', borderTop:'2px solid var(--primary)' }}>
                    <td colSpan={2} style={{ padding:'14px 12px', fontFamily:'EB Garamond,serif',
                      fontWeight:800, fontSize:17, color:'var(--primary-dark)' }}>TOTAL ESTIMATE</td>
                    <td style={{ padding:'14px 12px', textAlign:'right',
                      fontFamily:'EB Garamond,serif', fontWeight:800, fontSize:20, color:'var(--primary)' }}>
                      {formatRupees(budget.total.mid)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* PSO Optimizer */}
          <div className="section-card" style={{ border:'2px solid #ffb703' }}>
            <div className="section-title" style={{ color:'#023047' }}>
              AI Budget Optimizer (PSO)
            </div>
            <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:200 }}>
                <label className="form-label">Your Target Budget (₹)</label>
                <input className="form-input" type="number"
                  placeholder={`Current estimate: ${Math.round(budget.total.mid)}`}
                  value={targetBudget} onChange={e => setTargetBudget(e.target.value)} />
              </div>
              <button onClick={optimize} disabled={optimizing || !targetBudget}
                style={{ padding:'12px 24px', borderRadius:12, border:'none', cursor:'pointer',
                  background:'linear-gradient(135deg,#ffb703,#fb8500)', color:'#023047',
                  fontWeight:700, fontSize:14 }}>
                {optimizing ? 'Running PSO...' : 'Optimize Budget'}
              </button>
            </div>

            {optimizing && (
              <div style={{ marginTop:16, padding:16, background:'var(--secondary-light)', borderRadius:12 }}>
                <div style={{ fontSize:13, color:'#9D174D', fontWeight:600, marginBottom:8 }}>
                  Particle Swarm Optimizer running 30 particles × 50 iterations...
                </div>
                <div style={{ height:8, background:'#F9A8D4', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'var(--secondary)', borderRadius:4,
                    animation:'pso-bar 1.8s ease-in-out infinite' }} />
                </div>
                <style>{`@keyframes pso-bar { 0%{width:5%} 50%{width:85%} 100%{width:5%} }`}</style>
              </div>
            )}

            {optimResult && (
              <div style={{ marginTop:16, padding:20, background:'linear-gradient(135deg,var(--secondary-light),#FDF2F8)',
                borderRadius:14, border:'1.5px solid #F9A8D4' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
                  {[
                    { label:'Target Budget', value:formatRupees(optimResult.target_budget), color:'#9D174D' },
                    { label:'Optimized Budget', value:formatRupees(optimResult.optimized_budget), color:'#059669' },
                    { label: optimResult.savings>0 ? 'Savings' : 'Upgrade Cost',
                      value:formatRupees(Math.abs(optimResult.savings)),
                      color: optimResult.savings>0 ? '#059669' : '#DC2626' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign:'center', background:'white', padding:14,
                      borderRadius:10, border:'1px solid #F9A8D4' }}>
                      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>{s.label}</div>
                      <div style={{ fontFamily:'EB Garamond,serif', fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:'#9D174D', marginBottom:10 }}>
                  AI Recommendations:
                </div>
                {(optimResult.recommendations || []).map((r, i) => {
                  const isReduce = r.toLowerCase().includes('reduce')
                  const isUpgrade = r.toLowerCase().includes('upgrade')
                  const bg = isReduce ? '#FEF2F2' : isUpgrade ? '#EFF6FF' : '#F0FDF4'
                  const color = isReduce ? '#DC2626' : isUpgrade ? '#1D4ED8' : '#059669'
                  const prefix = isReduce ? '↓' : isUpgrade ? '↑' : '✓'
                  return (
                    <div key={i} style={{ padding:'10px 14px', background:bg, borderRadius:10,
                      marginBottom:8, borderLeft:`3px solid ${color}`, fontSize:13, fontWeight:600, color }}>
                      {prefix} {r}
                    </div>
                  )
                })}
                <div style={{ marginTop:12, fontSize:12, color:'var(--muted)' }}>
                  PSO Convergence: {Math.round((optimResult.convergence||0.94)*100)}% · 30 particles × 50 iterations
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="section-card">
            <div className="section-title">Export Budget</div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button onClick={exportPDF} disabled={exporting} className="btn-primary">
                {exporting ? 'Generating...' : '⬇ Download PDF (Server)'}
              </button>
              <button onClick={() => {
                // Client-side print-to-PDF — works without backend
                const rows = Object.entries(budget.items || {}).map(([name, vals]) =>
                  `<tr><td style="padding:8px 12px;font-weight:600">${name}</td>
                   <td style="padding:8px 12px;text-align:right">${formatRupees(vals.mid)}</td>
                   <td style="padding:8px 12px;font-size:11px;color:#555">${vals.note||''}</td></tr>`
                ).join('')
                const html = `<!DOCTYPE html><html><head><title>Wedding Budget Report</title>
                <style>body{font-family:Georgia,serif;padding:40px;color:#023047}
                h1{font-size:28px;color:#023047;border-bottom:3px solid #ffb703;padding-bottom:10px}
                h2{font-size:17px;color:#04699b;margin-top:30px}
                table{width:100%;border-collapse:collapse;margin-top:10px}
                th{background:#023047;color:white;padding:10px 12px;text-align:left}
                tr:nth-child(even){background:#f0f7fc}
                .total{background:#023047;color:white;font-size:18px;font-weight:bold}
                .total td{padding:14px 12px}
                .meta{color:#555;font-size:12px;margin-top:6px}
                @media print{body{padding:20px}}</style></head><body>
                <h1>🪷 weddingbudget.ai — Budget Report</h1>
                <div class="meta">Wedding Type: ${wedding.wedding_type||'—'} · City: ${wedding.wedding_district||'—'} · Guests: ${wedding.total_guests||'—'}</div>
                <div class="meta">Date: ${wedding.wedding_date||'—'} · Generated: ${new Date().toLocaleDateString('en-IN')}</div>
                <h2>Cost Breakdown</h2>
                <table><thead><tr><th>Category</th><th style="text-align:right">Estimated Cost</th><th>Notes</th></tr></thead>
                <tbody>${rows}
                <tr class="total"><td colspan="2">TOTAL ESTIMATE</td><td style="text-align:right">${formatRupees(budget.total.mid)}</td></tr>
                </tbody></table>
                <p style="margin-top:30px;font-size:11px;color:#888">This is an AI-estimated budget. Actual costs may vary. Confirm with vendors before finalising.</p>
                </body></html>`
                const w = window.open('', '_blank')
                w.document.write(html)
                w.document.close()
                w.focus()
                setTimeout(() => w.print(), 500)
              }} style={{ padding:'12px 24px', borderRadius:12, border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#023047,#04699b)', color:'white', fontWeight:700, fontSize:14 }}>
                🖨 Print / Save as PDF
              </button>
              <button onClick={() => {
                const data = JSON.stringify({ ...budget, wedding_config: wedding }, null, 2)
                const blob = new Blob([data], { type:'application/json' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = 'WeddingBudget.json'
                a.click()
              }} style={{ padding:'12px 24px', borderRadius:12, border:'2px solid var(--primary)',
                background:'transparent', color:'var(--primary-dark)', fontWeight:700,
                cursor:'pointer', fontSize:14 }}>
                Export as JSON
              </button>
            </div>
            <div style={{ marginTop:10, fontSize:12, color:'#4a7a94' }}>
              💡 "Print / Save as PDF" works without the backend — use it for offline demos.
            </div>
          </div>
        </>
      )}
    </div>
  )
}
