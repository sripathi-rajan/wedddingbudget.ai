import { useState, useEffect } from 'react'

const API = 'http://localhost:8000/api'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'wedding@admin2025'

function AdminLogin({ onSuccess }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const attempt = () => {
    setLoading(true)
    setTimeout(() => {
      if (pw === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin_auth', '1')
        onSuccess()
      } else {
        setErr('Incorrect password. Please try again.')
        setPw('')
      }
      setLoading(false)
    }, 600)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F0E17', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1E1B4B', borderRadius: 20, padding: '40px 48px', width: 380,
        border: '1px solid rgba(255,183,3,0.3)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <div style={{ fontFamily: 'EB Garamond, serif', fontSize: 26, fontWeight: 800, color: '#ffb703' }}>
            Admin Panel
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
            WeddingBudget.ai — Restricted Access
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>
            Admin Password
          </label>
          <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && attempt()}
            placeholder="Enter password"
            style={{ width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14,
              background: 'rgba(255,255,255,0.07)', border: `1.5px solid ${err ? '#f87171' : 'rgba(255,255,255,0.15)'}`,
              color: 'white', fontFamily: 'Inter, sans-serif', outline: 'none' }} />
        </div>
        {err && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>⚠️ {err}</div>}
        <button onClick={attempt} disabled={!pw || loading}
          style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#ffb703,#fb8500)',
            color: '#023047', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15,
            cursor: pw && !loading ? 'pointer' : 'not-allowed', opacity: pw && !loading ? 1 : 0.6 }}>
          {loading ? 'Verifying...' : 'Login to Admin Panel'}
        </button>
        <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          Default password: wedding@admin2025
        </div>
      </div>
    </div>
  )
}

const COST_TABLES = {
  'Wedding Type Base Costs': {
    description: 'Base package cost per wedding tradition (Low/Mid/High)',
    data: [
      { name:'Hindu',     low:800000,  mid:2500000, high:8000000 },
      { name:'Islam',     low:600000,  mid:1800000, high:5000000 },
      { name:'Sikh',      low:700000,  mid:2000000, high:6000000 },
      { name:'Christian', low:500000,  mid:1500000, high:4000000 },
      { name:'Buddhist',  low:400000,  mid:1200000, high:3500000 },
      { name:'Jain',      low:600000,  mid:1800000, high:5000000 },
      { name:'Generic',   low:400000,  mid:1500000, high:4500000 },
    ]
  },
  'Event Costs': {
    description: 'Per-event costs (Low/Mid/High)',
    data: [
      { name:'Engagement',           low:50000,  mid:150000,  high:500000 },
      { name:'Haldi',                low:20000,  mid:60000,   high:200000 },
      { name:'Mehendi',              low:30000,  mid:100000,  high:350000 },
      { name:'Sangeet',              low:100000, mid:350000,  high:1200000 },
      { name:'Pre Wedding Cocktail', low:80000,  mid:250000,  high:900000 },
      { name:'Wedding Day Ceremony', low:200000, mid:600000,  high:2000000 },
      { name:'Reception',            low:150000, mid:500000,  high:1800000 },
    ]
  },
  'Venue Costs/Day': {
    description: 'Venue rental cost per day (Low/Mid/High)',
    data: [
      { name:'Banquet Hall',   low:50000,  mid:150000,  high:500000 },
      { name:'Wedding Lawn',   low:40000,  mid:120000,  high:400000 },
      { name:'Hotel 3-5 Star', low:100000, mid:350000,  high:1200000 },
      { name:'Resort',         low:150000, mid:500000,  high:2000000 },
      { name:'Heritage Palace',low:300000, mid:1000000, high:5000000 },
      { name:'Beach Venue',    low:200000, mid:600000,  high:2500000 },
      { name:'Farmhouse',      low:50000,  mid:150000,  high:500000 },
      { name:'Temple',         low:10000,  mid:40000,   high:150000 },
      { name:'Home Intimate',  low:10000,  mid:30000,   high:100000 },
    ]
  },
  'Artist Costs': {
    description: 'Artist & entertainment rates (Low/High range)',
    data: [
      { name:'Local DJ',            low:50000,   high:150000 },
      { name:'Professional DJ',     low:200000,  high:500000 },
      { name:'Bollywood Singer A',  low:800000,  high:1200000 },
      { name:'Bollywood Singer B',  low:500000,  high:900000 },
      { name:'Live Band (Local)',   low:100000,  high:300000 },
      { name:'Live Band (National)',low:500000,  high:1500000 },
      { name:'Folk Artist',         low:30000,   high:100000 },
      { name:'Myra Entertainment',  low:200000,  high:600000 },
      { name:'Choreographer',       low:50000,   high:200000 },
      { name:'Anchor / Emcee',      low:30000,   high:150000 },
    ]
  },
  'Specialty Counter Rates (per head ₹)': {
    description: 'Per-head cost for specialty food/beverage counters at the wedding — admin editable',
    data: [
      { name:'Chaat Counter',    mid:70  },
      { name:'Mocktail Bar',     mid:90  },
      { name:'Ice Cream Station',mid:55  },
      { name:'Tea-Coffee 24hr',  mid:35  },
      { name:'Paan Counter',     mid:45  },
      { name:'Fruit Station',    mid:65  },
    ]
  },
  'Mandapam Pricing (₹/day)': {
    description: 'Admin-set cost per day for mandapam/banquet venues — users cannot override these',
    data: [
      { name:'Generic Mandapam (any city)',  mid:200000 },
      { name:'Premium Banquet Hall',         mid:400000 },
      { name:'Luxury Convention Centre',     mid:750000 },
      { name:'Chennai — Narada Gana Sabha',  mid:280000 },
      { name:'Chennai — Sathyam Convention', mid:550000 },
      { name:'Mumbai — Taj Lands End',       mid:900000 },
      { name:'Delhi — Taj Palace',           mid:950000 },
      { name:'Bengaluru — Leela Palace',     mid:850000 },
      { name:'Hyderabad — Taj Falaknuma',    mid:1200000 },
    ]
  },
}

const ML_SAMPLES = [
  { function_type:'Mandap',      style:'Romantic',    complexity:'High',   cost:180000, region:'Pan-India' },
  { function_type:'Mandap',      style:'Traditional', complexity:'High',   cost:200000, region:'North India' },
  { function_type:'Mandap',      style:'Luxury',      complexity:'High',   cost:350000, region:'Rajasthan' },
  { function_type:'Entrance',    style:'Traditional', complexity:'Medium', cost:45000,  region:'South India' },
  { function_type:'Entrance',    style:'Modern',      complexity:'High',   cost:90000,  region:'Metro' },
  { function_type:'Table Decor', style:'Minimalist',  complexity:'Low',    cost:35000,  region:'Pan-India' },
  { function_type:'Table Decor', style:'Romantic',    complexity:'Medium', cost:65000,  region:'Pan-India' },
  { function_type:'Ceiling',     style:'Modern',      complexity:'High',   cost:120000, region:'Metro' },
  { function_type:'Backdrop',    style:'Boho',        complexity:'Medium', cost:65000,  region:'Pan-India' },
  { function_type:'Stage',       style:'Luxury',      complexity:'High',   cost:400000, region:'Metro' },
  { function_type:'Lighting',    style:'Traditional', complexity:'Low',    cost:22000,  region:'Pan-India' },
  { function_type:'Pillars',     style:'Luxury',      complexity:'High',   cost:280000, region:'Rajasthan' },
]

function fmt(n) {
  if (!n) return '₹0'
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n/1000).toFixed(0)}K`
  return `₹${n}`
}

function AdminPageInner({ onClose }) {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [apiStatus, setApiStatus] = useState('checking')


  useEffect(() => {
    fetch(`${API}/admin/`)
      .then(r => r.json())
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))
  }, [])

  const sections = [
    { id:'dashboard', label:'Dashboard', icon:'📊' },
    { id:'cost-tables', label:'Cost Tables', icon:'💰' },
    { id:'ml-model', label:'ML Model', icon:'🤖' },
    { id:'settings', label:'Settings', icon:'⚙️' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#0F0E17', color:'white', fontFamily:'Inter,sans-serif' }}>
      {/* Admin Header */}
      <div style={{ background:'linear-gradient(90deg,#1E1B4B,#4C1D95)', padding:'16px 28px',
        display:'flex', alignItems:'center', gap:16,
        boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize:28 }}>⚙️</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'EB Garamond,serif', fontSize:22, fontWeight:800 }}>
            weddingbudget.ai — Admin Panel
          </div>
          <div style={{ fontSize:12, opacity:0.7, marginTop:2 }}>System configuration & management</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
          <div style={{ width:8, height:8, borderRadius:'50%',
            background: apiStatus==='online' ? '#4ADE80' : apiStatus==='offline' ? '#F87171' : '#FCD34D' }} />
          <span style={{ opacity:0.8 }}>Backend: {apiStatus}</span>
        </div>
        <button onClick={onClose}
          style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)',
            color:'white', borderRadius:10, padding:'8px 20px', cursor:'pointer',
            fontWeight:700, fontSize:14 }}>
          Back to App
        </button>
      </div>

      <div style={{ display:'flex', minHeight:'calc(100vh - 68px)' }}>
        {/* Sidebar */}
        <div style={{ width:220, background:'#1A1A2E', borderRight:'1px solid rgba(255,255,255,0.08)',
          padding:'20px 12px' }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:12,
                padding:'12px 16px', borderRadius:12, border:'none', cursor:'pointer',
                background: activeSection===s.id ? 'linear-gradient(135deg,#7C3AED,#5B21B6)' : 'transparent',
                color: activeSection===s.id ? 'white' : 'rgba(255,255,255,0.6)',
                fontWeight: activeSection===s.id ? 700 : 500,
                fontSize:14, marginBottom:4, textAlign:'left', transition:'all 0.2s' }}>
              <span style={{ fontSize:18 }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:'28px', overflowY:'auto' }}>

          {/* DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div>
              <h2 style={{ fontFamily:'EB Garamond,serif', fontSize:26, fontWeight:800, marginBottom:24, color:'#E0D7FF' }}>
                Dashboard
              </h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:20, marginBottom:32 }}>
                {[
                  { label:'Cost Tables', value:'4 categories', icon:'💰', color:'#7C3AED' },
                  { label:'ML Training Samples', value:`${ML_SAMPLES.length} items`, icon:'🤖', color:'#EC4899' },
                  { label:'Decor Categories', value:'10 function types', icon:'🎨', color:'#059669' },
                  { label:'Weekend Surcharge', value:'15%', icon:'📅', color:'#D97706' },
                  { label:'Contingency Rate', value:'8%', icon:'⚡', color:'#0D9488' },
                  { label:'Backend Status', value:apiStatus, icon:'🌐', color: apiStatus==='online'?'#059669':'#DC2626' },
                ].map(card => (
                  <div key={card.label} style={{ background:'#1E1B4B', borderRadius:16, padding:20,
                    border:`1px solid ${card.color}40` }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>{card.icon}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:card.color, fontFamily:'EB Garamond,serif' }}>
                      {card.value}
                    </div>
                    <div style={{ fontSize:13, opacity:0.7, marginTop:4 }}>{card.label}</div>
                  </div>
                ))}
              </div>

              {/* ML Dataset preview */}
              <div style={{ background:'#1E1B4B', borderRadius:16, padding:24,
                border:'1px solid rgba(124,58,237,0.3)' }}>
                <h3 style={{ fontFamily:'EB Garamond,serif', fontSize:20, fontWeight:700,
                  color:'#E0D7FF', marginBottom:16 }}>ML Training Dataset Preview</h3>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
                        {['Function Type','Style','Complexity','Actual Cost','Region'].map(h => (
                          <th key={h} style={{ padding:'8px 12px', textAlign:'left',
                            color:'rgba(255,255,255,0.5)', fontWeight:600, fontSize:12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ML_SAMPLES.map((s, i) => (
                        <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding:'9px 12px', fontWeight:600, color:'#C4B5FD' }}>{s.function_type}</td>
                          <td style={{ padding:'9px 12px', color:'#F9A8D4' }}>{s.style}</td>
                          <td style={{ padding:'9px 12px' }}>
                            <span style={{ padding:'2px 10px', borderRadius:8, fontSize:11, fontWeight:700,
                              background: s.complexity==='High'?'#BE185D30':s.complexity==='Medium'?'#D9770630':'#05996930',
                              color: s.complexity==='High'?'#F472B6':s.complexity==='Medium'?'#FCD34D':'#34D399' }}>
                              {s.complexity}
                            </span>
                          </td>
                          <td style={{ padding:'9px 12px', fontWeight:700, color:'#FDE68A' }}>{fmt(s.cost)}</td>
                          <td style={{ padding:'9px 12px', color:'rgba(255,255,255,0.5)', fontSize:12 }}>{s.region}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* COST TABLES */}
          {activeSection === 'cost-tables' && (
            <div>
              <h2 style={{ fontFamily:'EB Garamond,serif', fontSize:26, fontWeight:800, marginBottom:24, color:'#E0D7FF' }}>
                Cost Tables
              </h2>
              <div style={{ background:'#1A2744', borderRadius:12, padding:'12px 18px', marginBottom:20,
                border:'1px solid rgba(13,148,136,0.4)', fontSize:13, color:'#6EE7B7' }}>
                These tables define all cost estimates used in budget calculations. Changes here will affect new estimates.
              </div>

              {Object.entries(COST_TABLES).map(([tableName, tableData]) => (
                <div key={tableName} style={{ background:'#1E1B4B', borderRadius:16, padding:24,
                  border:'1px solid rgba(124,58,237,0.3)', marginBottom:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <h3 style={{ fontFamily:'EB Garamond,serif', fontSize:18, fontWeight:700, color:'#C4B5FD' }}>
                      {tableName}
                    </h3>
                    <button style={{ background:'rgba(124,58,237,0.2)', border:'1px solid rgba(124,58,237,0.5)',
                      color:'#C4B5FD', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                      Edit
                    </button>
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:14 }}>{tableData.description}</div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead>
                        <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ padding:'7px 12px', textAlign:'left', color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:600 }}>Type</th>
                          {tableData.data[0].mid !== undefined && (
                            <>
                              <th style={{ padding:'7px 12px', textAlign:'right', color:'#4ADE80', fontSize:12, fontWeight:600 }}>Low</th>
                              <th style={{ padding:'7px 12px', textAlign:'right', color:'#FCD34D', fontSize:12, fontWeight:600 }}>Mid</th>
                              <th style={{ padding:'7px 12px', textAlign:'right', color:'#F87171', fontSize:12, fontWeight:600 }}>High</th>
                            </>
                          )}
                          {tableData.data[0].mid === undefined && (
                            <>
                              <th style={{ padding:'7px 12px', textAlign:'right', color:'#4ADE80', fontSize:12, fontWeight:600 }}>Low</th>
                              <th style={{ padding:'7px 12px', textAlign:'right', color:'#F87171', fontSize:12, fontWeight:600 }}>High</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.data.map((row, i) => (
                          <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding:'8px 12px', fontWeight:600, color:'#E0D7FF' }}>{row.name}</td>
                            <td style={{ padding:'8px 12px', textAlign:'right', color:'#4ADE80' }}>{fmt(row.low)}</td>
                            {row.mid !== undefined && (
                              <td style={{ padding:'8px 12px', textAlign:'right', color:'#FCD34D' }}>{fmt(row.mid)}</td>
                            )}
                            <td style={{ padding:'8px 12px', textAlign:'right', color:'#F87171' }}>{fmt(row.high)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ML MODEL */}
          {activeSection === 'ml-model' && (
            <div>
              <h2 style={{ fontFamily:'EB Garamond,serif', fontSize:26, fontWeight:800, marginBottom:24, color:'#E0D7FF' }}>
                ML Model — Decor Intelligence
              </h2>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:24 }}>
                {[
                  { label:'Algorithm', value:'RandomForest Regressor', icon:'🌲', color:'#059669' },
                  { label:'Training Samples', value:'200 (augmented)', icon:'📊', color:'#7C3AED' },
                  { label:'Feature Dimensions', value:'64 + one-hot', icon:'📐', color:'#EC4899' },
                  { label:'Embedding Model', value:'MobileNetV2 (simulated)', icon:'🧠', color:'#D97706' },
                  { label:'Avg. MAE', value:'~₹12,000', icon:'🎯', color:'#0D9488' },
                  { label:'Confidence Range', value:'80–95%', icon:'✅', color:'#059669' },
                ].map(m => (
                  <div key={m.label} style={{ background:'#1E1B4B', borderRadius:14, padding:18,
                    border:`1px solid ${m.color}40` }}>
                    <div style={{ fontSize:24, marginBottom:8 }}>{m.icon}</div>
                    <div style={{ fontSize:17, fontWeight:700, color:m.color }}>{m.value}</div>
                    <div style={{ fontSize:12, opacity:0.6, marginTop:3 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background:'#1E1B4B', borderRadius:16, padding:24,
                border:'1px solid rgba(236,72,153,0.3)', marginBottom:20 }}>
                <h3 style={{ fontFamily:'EB Garamond,serif', fontSize:18, fontWeight:700,
                  color:'#F9A8D4', marginBottom:16 }}>Function Type Rates (Mid Estimate)</h3>
                {[
                  { type:'Mandap',      low:150000, mid:200000, high:400000, note:'Core ceremony structure' },
                  { type:'Stage',       low:150000, mid:250000, high:450000, note:'Performance and photo stage' },
                  { type:'Pillars',     low:100000, mid:200000, high:350000, note:'Hall pillar draping' },
                  { type:'Ceiling',     low:60000,  mid:100000, high:200000, note:'Overhead installations' },
                  { type:'Backdrop',    low:40000,  mid:70000,  high:150000, note:'Photo/video backdrops' },
                  { type:'Entrance',    low:30000,  mid:55000,  high:120000, note:'Entry gate decoration' },
                  { type:'Photo Booth', low:25000,  mid:60000,  high:120000, note:'Selfie/photo stations' },
                  { type:'Table Decor', low:20000,  mid:45000,  high:90000,  note:'Centerpieces & florals' },
                  { type:'Lighting',    low:15000,  mid:30000,  high:70000,  note:'Ambient & effect lighting' },
                  { type:'Aisle',       low:10000,  mid:22000,  high:50000,  note:'Ceremony aisle setup' },
                ].map((r, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:13 }}>
                    <div>
                      <div style={{ fontWeight:700, color:'#E0D7FF' }}>{r.type}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{r.note}</div>
                    </div>
                    <div style={{ display:'flex', gap:16, textAlign:'right' }}>
                      <div><div style={{ fontSize:10, color:'#4ADE80', marginBottom:1 }}>Low</div><div style={{ fontWeight:700, color:'#4ADE80' }}>{fmt(r.low)}</div></div>
                      <div><div style={{ fontSize:10, color:'#FCD34D', marginBottom:1 }}>Mid</div><div style={{ fontWeight:700, color:'#FCD34D' }}>{fmt(r.mid)}</div></div>
                      <div><div style={{ fontSize:10, color:'#F87171', marginBottom:1 }}>High</div><div style={{ fontWeight:700, color:'#F87171' }}>{fmt(r.high)}</div></div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background:'#1E1B4B', borderRadius:16, padding:24,
                border:'1px solid rgba(124,58,237,0.3)' }}>
                <h3 style={{ fontFamily:'EB Garamond,serif', fontSize:18, fontWeight:700,
                  color:'#C4B5FD', marginBottom:16 }}>Style Multipliers</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                  {[
                    { style:'Luxury',     mult:'1.45×', color:'#FCD34D' },
                    { style:'Whimsical',  mult:'1.25×', color:'#C4B5FD' },
                    { style:'Romantic',   mult:'1.15×', color:'#F9A8D4' },
                    { style:'Modern',     mult:'1.05×', color:'#93C5FD' },
                    { style:'Traditional',mult:'0.95×', color:'#6EE7B7' },
                    { style:'Rustic',     mult:'0.88×', color:'#FCA5A5' },
                    { style:'Boho',       mult:'0.90×', color:'#86EFAC' },
                    { style:'Minimalist', mult:'0.72×', color:'#CBD5E1' },
                    { style:'Playful',    mult:'0.80×', color:'#67E8F9' },
                  ].map(m => (
                    <div key={m.style} style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'12px 14px',
                      display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)' }}>{m.style}</span>
                      <span style={{ fontSize:15, fontWeight:800, color:m.color }}>{m.mult}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeSection === 'settings' && (
            <div>
              <h2 style={{ fontFamily:'EB Garamond,serif', fontSize:26, fontWeight:800, marginBottom:24, color:'#E0D7FF' }}>
                Settings
              </h2>

              {[
                { label:'Weekend Surcharge Rate', value:'15%', key:'weekend_surcharge', editable:true },
                { label:'Contingency Buffer Rate', value:'8%', key:'contingency_rate', editable:true },
                { label:'Backend API URL', value:'http://localhost:8000', key:'api_url', editable:true },
                { label:'ML Model Path', value:'backend/decor_model.joblib', key:'model_path', editable:false },
                { label:'Default Guest Count', value:'200', key:'default_guests', editable:true },
                { label:'Currency', value:'INR (₹)', key:'currency', editable:false },
              ].map(s => (
                <div key={s.key} style={{ background:'#1E1B4B', borderRadius:14, padding:20,
                  border:'1px solid rgba(255,255,255,0.08)', marginBottom:14,
                  display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#E0D7FF' }}>{s.label}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:3 }}>Key: {s.key}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ fontFamily:'monospace', fontSize:14, color:'#FCD34D', padding:'6px 14px',
                      background:'rgba(252,211,77,0.1)', borderRadius:8 }}>{s.value}</div>
                    {s.editable && (
                      <button style={{ background:'rgba(124,58,237,0.2)', border:'1px solid rgba(124,58,237,0.5)',
                        color:'#C4B5FD', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div style={{ background:'#1A2744', borderRadius:14, padding:20,
                border:'1px solid rgba(13,148,136,0.4)', marginTop:24 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#6EE7B7', marginBottom:8 }}>
                  System Information
                </div>
                {[
                  { label:'App Version', value:'2.0.0 (weddingbudget.ai)' },
                  { label:'Frontend', value:'React + Vite' },
                  { label:'Backend', value:'FastAPI + Python' },
                  { label:'ML Stack', value:'scikit-learn RandomForest + MobileNetV2' },
                  { label:'Optimization', value:'PSO (30 particles × 50 iterations)' },
                ].map(s => (
                  <div key={s.label} style={{ display:'flex', justifyContent:'space-between',
                    padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13 }}>
                    <span style={{ color:'rgba(255,255,255,0.5)' }}>{s.label}</span>
                    <span style={{ color:'#E0D7FF', fontWeight:600 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPage({ onClose }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_auth') === '1')
  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />
  return <AdminPageInner onClose={onClose} />
}
