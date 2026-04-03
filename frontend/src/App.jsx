import { useState, useRef } from 'react'
import { WeddingProvider, useWedding } from './context/WeddingContext'
import Tab1Style from './pages/Tab1Style'
import Tab2Venue from './pages/Tab2Venue'
import Tab3Decor from './pages/Tab3Decor'
import Tab4Food from './pages/Tab4Food'
import Tab5Artists from './pages/Tab5Artists'
import { Tab6Sundries, Tab7Logistics } from './pages/Tab6and7'
import Tab8Budget from './pages/Tab8Budget'
import AdminPage from './pages/AdminPage'

const C = { primary: '#023047', amber: '#ffb703', blue: '#219ebc', light: '#e8f4fa', sky: '#8ecae6', orange: '#fb8500' }

const TABS = [
  { id: 0, label: '💒 Style',     short: 'Style' },
  { id: 1, label: '🏛️ Venue',     short: 'Venue' },
  { id: 2, label: '🎨 Decor AI',  short: 'Decor' },
  { id: 3, label: '🍽️ Food',      short: 'Food' },
  { id: 4, label: '🎤 Artists',   short: 'Artists' },
  { id: 5, label: '🧺 Sundries',  short: 'Sundries' },
  { id: 6, label: '🚐 Logistics', short: 'Logistics' },
  { id: 7, label: '💰 Budget',    short: 'Budget' },
]

// ─── Welcome / Landing Page ────────────────────────────────────────────────────
function WelcomePage({ onEnter }) {
  const [fading, setFading] = useState(false)

  const enter = (role) => {
    if (role === 'admin') {
      const pwd = prompt('Enter admin password:')
      if (pwd !== 'wedding@admin2025') { alert('Incorrect password'); return }
    }
    setFading(true)
    setTimeout(() => onEnter(role), 600)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(135deg,#1A1207 0%,#3D2B15 60%,#1A1207 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      opacity: fading ? 0 : 1, transition: 'opacity 0.6s'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 560, padding: '2rem' }}>
        <div style={{ fontSize: 72, marginBottom: '1rem' }}>🪷</div>
        <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: 52, color: '#C9A84C', margin: '0 0 .5rem' }}>
          weddingbudget.ai
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(250,248,243,0.7)', marginBottom: '.5rem' }}>
          Intelligent Wedding Planning Platform
        </p>
        <p style={{ fontSize: 13, color: 'rgba(250,248,243,0.4)', marginBottom: '2.5rem' }}>
          AI-powered budget estimation · Decor price prediction · End-to-end planning
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => enter('client')} style={{
            padding: '14px 40px', borderRadius: 12, border: 'none',
            background: '#C9A84C', color: '#1A1207', fontSize: 15, fontWeight: 700, cursor: 'pointer'
          }}>
            Start Planning →
          </button>
          <button onClick={() => enter('admin')} style={{
            padding: '14px 36px', borderRadius: 12,
            border: '1.5px solid rgba(201,168,76,0.5)', background: 'transparent',
            color: '#C9A84C', fontSize: 15, fontWeight: 600, cursor: 'pointer'
          }}>
            Admin Login
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(250,248,243,0.25)', marginTop: '2rem' }}>
          Built for Hackathon 2026 · TCE
        </p>
      </div>
    </div>
  )
}

// ─── Admin Panel Tab ───────────────────────────────────────────────────────────
const BOOKING_REQUESTS_INIT = [
  { id:1, name:'Priya & Rahul',   date:'15 Apr 2026', budget:'₹45L', status:'Pending' },
  { id:2, name:'Meena & Karthik', date:'22 May 2026', budget:'₹28L', status:'Pending' },
  { id:3, name:'Sana & Ahmed',    date:'10 Jun 2026', budget:'₹62L', status:'Pending' },
]
const PRICING_ROWS = ['Venue','Catering','Decor','Entertainment','Logistics','Accommodation','Sundries']

function AdminTab() {
  const [pricing, setPricing]     = useState(() => Object.fromEntries(PRICING_ROWS.map(r => [r, { min:'', max:'' }])))
  const [toast, setToast]         = useState('')
  const [bookings, setBookings]   = useState(BOOKING_REQUESTS_INIT)
  const [negLog, setNegLog]       = useState([])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const handlePriceUpdate = (row) => {
    showToast(`✓ ${row} pricing updated`)
  }

  const handleBooking = (id, action) => {
    const b = bookings.find(x => x.id === id)
    if (action === 'Accept') {
      setBookings(bs => bs.map(x => x.id===id ? {...x, status:'Confirmed ✓'} : x))
    } else if (action === 'Decline') {
      setBookings(bs => bs.map(x => x.id===id ? {...x, status:'Declined'} : x))
    } else {
      const counter = prompt(`Counter offer for ${b.name} (current: ${b.budget}):`)
      if (!counter) return
      const time = new Date().toLocaleTimeString('en-IN')
      setBookings(bs => bs.map(x => x.id===id ? {...x, status:`Counter ₹${counter} sent`} : x))
      setNegLog(lg => [...lg, { client: b.name, budget: b.budget, counter, status:'Negotiating', time }])
    }
  }

  const statusColor = (s) => s.includes('Confirmed') ? '#059669' : s.includes('Declined') ? '#DC2626' : s.includes('Counter') ? '#D97706' : C.blue

  return (
    <div>
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999,
          background:'#059669', color:'white', padding:'10px 20px', borderRadius:10,
          fontWeight:700, fontSize:14, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Section A — Pricing Control */}
      <div className="section-card">
        <div className="section-title">⚙ Pricing Control</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--ivory-dark)' }}>
                {['Category','Min ₹','Max ₹',''].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left',
                    fontWeight:700, color:C.primary, borderBottom:`2px solid ${C.amber}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRICING_ROWS.map((row, i) => (
                <tr key={row} style={{ background: i%2===0 ? 'white' : 'var(--ivory)' }}>
                  <td style={{ padding:'10px 12px', fontWeight:700, color:C.primary }}>{row}</td>
                  <td style={{ padding:'8px 12px' }}>
                    <input type="number" placeholder="Min ₹" value={pricing[row].min}
                      onChange={e => setPricing(p => ({...p, [row]:{...p[row], min: e.target.value}}))}
                      style={{ width:110, padding:'6px 10px', border:`1.5px solid ${C.sky}`, borderRadius:8, fontSize:13 }} />
                  </td>
                  <td style={{ padding:'8px 12px' }}>
                    <input type="number" placeholder="Max ₹" value={pricing[row].max}
                      onChange={e => setPricing(p => ({...p, [row]:{...p[row], max: e.target.value}}))}
                      style={{ width:110, padding:'6px 10px', border:`1.5px solid ${C.sky}`, borderRadius:8, fontSize:13 }} />
                  </td>
                  <td style={{ padding:'8px 12px' }}>
                    <button onClick={() => handlePriceUpdate(row)} style={{
                      padding:'7px 18px', borderRadius:8, border:'none', cursor:'pointer',
                      background:`linear-gradient(135deg,${C.amber},${C.orange})`,
                      color:C.primary, fontWeight:700, fontSize:12
                    }}>Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section B — Booking Requests */}
      <div className="section-card">
        <div className="section-title">📋 Booking Requests</div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {bookings.map(b => {
            const done = b.status !== 'Pending'
            const bg = b.status.includes('Confirmed') ? '#f0fdf4' : b.status.includes('Declined') ? '#fef2f2' : b.status.includes('Counter') ? '#fffbea' : 'white'
            return (
              <div key={b.id} style={{ padding:18, borderRadius:14, border:`1.5px solid ${statusColor(b.status)}20`, background:bg }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, color:C.primary }}>{b.name}</div>
                    <div style={{ fontSize:12, color:'#4a7a94', marginTop:3 }}>{b.date} · {b.budget}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    {!done ? (
                      <>
                        <button onClick={() => handleBooking(b.id,'Accept')} style={{
                          padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer',
                          background:'#059669', color:'white', fontWeight:700, fontSize:13 }}>Accept</button>
                        <button onClick={() => handleBooking(b.id,'Negotiate')} style={{
                          padding:'8px 18px', borderRadius:8, border:`2px solid ${C.amber}`, cursor:'pointer',
                          background:'white', color:C.primary, fontWeight:700, fontSize:13 }}>Negotiate</button>
                        <button onClick={() => handleBooking(b.id,'Decline')} style={{
                          padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer',
                          background:'#DC2626', color:'white', fontWeight:700, fontSize:13 }}>Decline</button>
                      </>
                    ) : (
                      <span style={{ fontWeight:700, fontSize:14, color:statusColor(b.status) }}>{b.status}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section C — Negotiation Log */}
      <div className="section-card">
        <div className="section-title">🗒 Negotiation Log</div>
        {negLog.length === 0 ? (
          <div style={{ fontSize:13, color:'#4a7a94', fontStyle:'italic' }}>No negotiations yet.</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--ivory-dark)' }}>
                  {['Client','Budget','Counter','Status','Time'].map(h => (
                    <th key={h} style={{ padding:'10px 12px', textAlign:'left',
                      fontWeight:700, color:C.primary, borderBottom:`2px solid ${C.amber}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {negLog.map((l,i) => (
                  <tr key={i} style={{ background: i%2===0 ? 'white' : 'var(--ivory)' }}>
                    <td style={{ padding:'10px 12px', fontWeight:600 }}>{l.client}</td>
                    <td style={{ padding:'10px 12px' }}>{l.budget}</td>
                    <td style={{ padding:'10px 12px', color:C.blue, fontWeight:700 }}>₹{l.counter}</td>
                    <td style={{ padding:'10px 12px' }}>{l.status}</td>
                    <td style={{ padding:'10px 12px', color:'#4a7a94', fontSize:12 }}>{l.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function validateTab(tabIndex, wedding) {
  const errors = []
  if (tabIndex === 0) {
    if (!wedding.wedding_date)   errors.push('Select a wedding date')
    if (!wedding.wedding_type)   errors.push('Select a wedding type')
    if (!wedding.budget_tier)    errors.push('Select a budget style')
    if (!wedding.events?.length) errors.push('Select at least one event')
  }
  if (tabIndex === 1) {
    if (!wedding.venue_type)       errors.push('Select a venue type')
    if (!wedding.wedding_state)    errors.push('Select the wedding state')
    if (!wedding.wedding_district) errors.push('Select the wedding district')
    if (!wedding.total_guests || wedding.total_guests < 1) errors.push('Enter the number of guests')
  }
  if (tabIndex === 2) {
    if (!wedding.selected_decor?.length) errors.push('Select at least one decor item from the gallery')
  }
  if (tabIndex === 3) {
    if (!wedding.food_categories?.length) errors.push('Select food category (Veg / Non-Veg / Jain)')
    if (!wedding.food_budget_tier)        errors.push('Select a food budget tier')
    if (!wedding.bar_type)                errors.push('Select bar type')
  }
  if (tabIndex === 4) {
    if (!wedding.selected_artists?.length) errors.push('Select at least one artist / entertainment option')
  }
  return errors
}

function BudgetStatusBar({ onAdminClick }) {
  const { wedding } = useWedding()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '12px 28px',
      background: `linear-gradient(90deg, ${C.primary}, #04699b, ${C.blue})`,
      color: 'white', boxShadow: `0 4px 20px rgba(2,48,71,0.4)`
    }}>
      <div style={{ fontSize: 26 }}>💍</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'EB Garamond,serif', fontSize: 22, fontWeight: 800, letterSpacing: 0.5 }}>
          WeddingBudget.ai
        </div>
        <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>AI-Powered Indian Wedding Budget Planner</div>
      </div>
      {wedding.wedding_type && (
        <div style={{ fontSize: 12, background: 'rgba(255,255,255,0.15)', padding: '4px 14px', borderRadius: 20, fontWeight: 600 }}>
          {wedding.wedding_type} Wedding
        </div>
      )}
      {wedding.wedding_district && (
        <div style={{ fontSize: 12, background: 'rgba(255,255,255,0.15)', padding: '4px 14px', borderRadius: 20, fontWeight: 600 }}>
          📍 {wedding.wedding_district}
        </div>
      )}
      {wedding.events?.length > 0 && (
        <div style={{ fontSize: 12, background: 'rgba(255,255,255,0.15)', padding: '4px 14px', borderRadius: 20, fontWeight: 600 }}>
          🎉 {wedding.events.length} Events
        </div>
      )}
      <button onClick={onAdminClick} title="Admin Panel"
        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
          color: 'white', borderRadius: 10, padding: '6px 14px', cursor: 'pointer',
          fontSize: 12, fontWeight: 700, marginLeft: 8 }}>
        ⚙️ Admin
      </button>
    </div>
  )
}

function AppInner() {
  const { wedding } = useWedding()
  const [activeTab, setActiveTab] = useState(0)
  const [validationErrors, setValidationErrors] = useState([])
  const [showAdmin, setShowAdmin] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [isAdminRole, setIsAdminRole] = useState(false)
  const topRef = useRef(null)

  const pages = [
    <Tab1Style />, <Tab2Venue />, <Tab3Decor />, <Tab4Food />,
    <Tab5Artists />, <Tab6Sundries />, <Tab7Logistics />, <Tab8Budget />, <AdminTab />
  ]

  const allTabs = [
    ...TABS,
    { id: 8, label: '⚙ Admin', short: 'Admin', adminOnly: true }
  ]

  const goTo = (tabIndex) => {
    setValidationErrors([])
    setActiveTab(tabIndex)
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const handleNext = () => {
    const errors = validateTab(activeTab, wedding)
    if (errors.length > 0) {
      setValidationErrors(errors)
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    setValidationErrors([])
    goTo(Math.min(TABS.length - 1, activeTab + 1))
  }

  if (showAdmin) return <AdminPage onClose={() => setShowAdmin(false)} />

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showWelcome && (
        <WelcomePage onEnter={(role) => {
          setIsAdminRole(role === 'admin')
          setShowWelcome(false)
        }} />
      )}
      <BudgetStatusBar onAdminClick={() => setShowAdmin(true)} />

      <div ref={topRef} style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '24px 20px', flex: 1 }}>
        {/* Tab Navigation */}
        <div style={{ marginBottom: 28 }}>
          <div className="tab-nav">
            {allTabs.filter(tab => !tab.adminOnly || isAdminRole).map(tab => (
              <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => goTo(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 5, marginTop: 12, justifyContent: 'center' }}>
            {allTabs.filter(tab => !tab.adminOnly || isAdminRole).map(tab => (
              <div key={tab.id} onClick={() => goTo(tab.id)}
                style={{ width: activeTab === tab.id ? 28 : 8, height: 8, borderRadius: 4,
                  background: tab.id < activeTab ? C.blue : activeTab === tab.id ? C.amber : C.sky,
                  transition: 'all 0.3s', cursor: 'pointer' }} />
            ))}
          </div>
        </div>

        {/* Validation */}
        {validationErrors.length > 0 && (
          <div className="validation-banner">
            <div style={{ marginBottom: 6, fontSize: 15 }}>Please complete the following before continuing:</div>
            {validationErrors.map((e, i) => (
              <div key={i} style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>• {e}</div>
            ))}
          </div>
        )}

        {/* Active page */}
        <div key={activeTab} style={{ animation: 'fadeIn 0.3s ease' }}>
          {pages[activeTab]}
        </div>

        {/* Next / Back */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20,
          borderTop: `1.5px solid ${C.sky}` }}>
          <button onClick={() => { setValidationErrors([]); goTo(Math.max(0, activeTab - 1)) }}
            disabled={activeTab === 0}
            style={{ padding: '11px 26px', borderRadius: 12, border: `2px solid ${C.sky}`,
              background: activeTab === 0 ? '#f0f4f8' : 'white',
              cursor: activeTab === 0 ? 'not-allowed' : 'pointer',
              color: C.primary, fontWeight: 700, fontSize: 15 }}>
            ← Back
          </button>
          <div style={{ fontSize: 13, color: '#4a7a94', alignSelf: 'center', fontWeight: 600 }}>
            Step {activeTab + 1} of {allTabs.filter(t => !t.adminOnly || isAdminRole).length}
          </div>
          {activeTab < 7 ? (
            <button onClick={handleNext} className="btn-primary">Next →</button>
          ) : (
            <button className="btn-primary" style={{ background: 'linear-gradient(135deg,#059669,#047857)', color: 'white' }}>
              ✅ Finalise
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  )
}

export default function App() {
  return (
    <WeddingProvider>
      <AppInner />
    </WeddingProvider>
  )
}
