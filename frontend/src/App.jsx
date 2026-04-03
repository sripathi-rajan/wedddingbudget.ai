import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WeddingProvider, useWedding } from './context/WeddingContext'
import LandingPage from './pages/LandingPage'
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

function TopNav({ activeTab, allTabs, isAdminRole, goTo, onAdminClick }) {
  const { wedding } = useWedding()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const visibleTabs = allTabs.filter(tab => !tab.adminOnly || isAdminRole)

  return (
    <nav className="top-nav" style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: '#ffffff',
      borderBottom: '1px solid #EBEBEB',
      height: 56, padding: '0 24px',
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
      transition: 'box-shadow 0.2s',
      fontFamily: "'DM Sans', 'Inter', sans-serif",
      maxWidth: '100vw', overflow: 'hidden'
    }}>
      {/* Left — logo */}
      <div className="logo-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
        <span style={{ fontSize: 17, lineHeight: 1 }}>🌸</span>
        <span className="logo-text" style={{ fontWeight: 700, fontSize: 14, color: '#111', letterSpacing: '-0.2px' }}>
          WeddingBudget.AI
        </span>
      </div>

      {/* Center — pill tabs with layoutId sliding indicator */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
        <div className="nav-tab-strip" style={{
          display: 'flex', gap: 2, padding: 3,
          background: '#ffffff', borderRadius: 10,
          overflow: 'auto', maxWidth: '100%'
        }}>
          {visibleTabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                style={{
                  position: 'relative',
                  padding: '5px 11px',
                  borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#111' : '#888',
                  background: 'transparent',
                  boxShadow: 'none',
                  fontFamily: "'DM Sans', 'Inter', sans-serif",
                  whiteSpace: 'nowrap', flexShrink: 0,
                  zIndex: 1
                }}
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    style={{
                      position: 'absolute', inset: 0,
                      background: '#fff', borderRadius: 7,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                      zIndex: -1
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="nav-tab-label" style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
                <span className="nav-tab-icon" style={{ position: 'relative', zIndex: 1, display: 'none' }}>{tab.label.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right — context chips + admin */}
      <div className="nav-right-chips" style={{ display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0 }}>
        {wedding.wedding_type && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
            background: '#FBE8EF', color: '#D4537E',
            border: '1px solid #F2C4D4',
            whiteSpace: 'nowrap'
          }}>
            {wedding.wedding_type}
          </span>
        )}
        {wedding.total_guests > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
            background: '#DCFCE7', color: '#16A34A',
            border: '1px solid #BBF7D0',
            whiteSpace: 'nowrap'
          }}>
            {wedding.total_guests} guests
          </span>
        )}
        <button
          onClick={onAdminClick}
          title="Admin Panel"
          style={{
            background: 'none', border: '1px solid #EBEBEB',
            borderRadius: 7, padding: '4px 10px',
            fontSize: 13, cursor: 'pointer', color: '#888',
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            lineHeight: 1
          }}
        >
          ⚙️
        </button>
      </div>
    </nav>
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

  // Listen for sticky "Next" buttons inside tab components
  useEffect(() => {
    const listener = () => handleNext()
    window.addEventListener('weddingNextTab', listener)
    return () => window.removeEventListener('weddingNextTab', listener)
  }, [activeTab, wedding])

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
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto' }}>
          <LandingPage onEnter={(role) => {
            setIsAdminRole(role === 'admin')
            setShowWelcome(false)
          }} />
        </div>
      )}
      <TopNav
        activeTab={activeTab}
        allTabs={allTabs}
        isAdminRole={isAdminRole}
        goTo={goTo}
        onAdminClick={() => setShowAdmin(true)}
      />
      <div style={{ width: '100%', height: 3, background: '#EBEBEB' }}>
        <div style={{ height: '100%', background: '#D4537E',
          width: `${(activeTab / 7) * 100}%`,
          transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
      </div>

      <div ref={topRef} style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '24px 20px', flex: 1 }}>
        {/* Progress dots */}
        <div className="progress-dots" style={{ display: 'flex', gap: 5, marginBottom: 24, justifyContent: 'center' }}>
          {allTabs.filter(tab => !tab.adminOnly || isAdminRole).map(tab => (
            <div key={tab.id} className="progress-dot" onClick={() => goTo(tab.id)}
              style={{ width: activeTab === tab.id ? 28 : 8, height: 8, borderRadius: 4,
                background: tab.id < activeTab ? '#D4537E' : activeTab === tab.id ? '#D4537E' : '#EBEBEB',
                transition: 'all 0.3s', cursor: 'pointer' }} />
          ))}
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

        {/* Active page — slide transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {pages[activeTab]}
          </motion.div>
        </AnimatePresence>

        {/* Next / Back */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20,
          borderTop: `1.5px solid ${C.sky}` }}>
          <button onClick={() => { setValidationErrors([]); goTo(Math.max(0, activeTab - 1)) }}
            disabled={activeTab === 0}
            style={{ padding: '11px 26px', borderRadius: 12, border: `2px solid ${C.sky}`,
              background: 'white',
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
