import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useWedding } from '../context/WeddingContext'
import { scrollToNextSection } from '../utils/scrollToNext'

// ─── Option definitions ────────────────────────────────────────────────────────

const WEDDING_TYPE_OPTIONS = [
  { id: 'Hindu',     icon: '🪔', label: 'Hindu' },
  { id: 'Islam',     icon: '🌙', label: 'Islamic' },
  { id: 'Sikh',      icon: '⚔️', label: 'Sikh' },
  { id: 'Christian', icon: '⛪', label: 'Christian' },
  { id: 'Buddhist',  icon: '☸️', label: 'Buddhist' },
  { id: 'Jain',      icon: '🙏', label: 'Jain' },
  { id: 'Generic',   icon: '🎊', label: 'Mixed / Generic' },
]

const BUDGET_STYLE_OPTIONS = [
  { id: 'Minimalist', icon: '🌿', label: 'Minimalist', desc: 'Under ₹15L · Essential elegance' },
  { id: 'Modest',     icon: '✨', label: 'Modest',     desc: '₹15L – ₹40L · Beautiful balance' },
  { id: 'Luxury',     icon: '👑', label: 'Luxury',     desc: '₹1Cr+ · No compromises' },
]

const EVENT_OPTIONS = [
  { id: 'Haldi',                icon: '🌼', label: 'Haldi' },
  { id: 'Mehendi',              icon: '🌿', label: 'Mehendi' },
  { id: 'Sangeet',              icon: '🎵', label: 'Sangeet' },
  { id: 'Wedding Day Ceremony', icon: '💒', label: 'Ceremony' },
  { id: 'Reception',            icon: '🎊', label: 'Reception' },
  { id: 'Engagement',           icon: '💍', label: 'Engagement' },
  { id: 'Pre Wedding Cocktail', icon: '🥂', label: 'Cocktail' },
  { id: 'Tilak',                icon: '🪔', label: 'Tilak',        isCustom: true },
  { id: 'Grihapravesh',         icon: '🏡', label: 'Grihapravesh', isCustom: true },
]

const EVENT_EMOJIS = ['🎉','🎊','🕯️','🎵','💃','🥂','🌸','🌺','🎭','🪔','🎇','🥁','👑','🌙','⭐','🎆']

const FONT = { fontFamily: "'DM Sans', 'Inter', sans-serif" }

// ─── Premium selection card ────────────────────────────────────────────────────

function SelCard({ item, isSelected, onToggle, hasAnySelected, wide = false }) {
  return (
    <div
      onClick={() => onToggle(item.id)}
      className={`sel-card${wide ? ' budget-style-card' : ''}${isSelected ? ' selected' : ''}${hasAnySelected && !isSelected ? ' dimmed' : ''}`}
      style={{
        border: `2px solid ${isSelected ? '#D4537E' : '#EBEBEB'}`,
        borderRadius: 14,
        background: isSelected ? '#FDF2F8' : 'white',
        padding: wide ? '18px 20px' : '20px 14px',
        textAlign: 'center',
        userSelect: 'none',
        display: 'flex',
        flexDirection: wide ? 'row' : 'column',
        alignItems: 'center',
        gap: wide ? 14 : 8,
        boxShadow: isSelected ? '0 4px 20px rgba(212,83,126,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Rose checkmark badge springs in on select */}
      <div className="check-badge-rose" style={{
        position: 'absolute', top: 8, right: 8,
        width: 22, height: 22, borderRadius: '50%',
        background: '#D4537E', color: 'white',
        fontSize: 12, fontWeight: 800,
        alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(212,83,126,0.4)',
        display: isSelected ? 'flex' : 'none',
        animation: isSelected ? 'checkSpring 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
        zIndex: 2
      }}>✓</div>

      <span className="sel-card-icon card-icon" style={{ fontSize: wide ? 28 : 32 }}>{item.icon}</span>
      <div>
        <div className="card-label" style={{ fontWeight: 700, fontSize: 13, color: isSelected ? '#B83A64' : '#111', ...FONT }}>
          {item.label}
        </div>
        {item.desc && (
          <div className="card-desc" style={{ fontSize: 11, color: isSelected ? '#B83A64' : '#888', marginTop: 3, ...FONT }}>
            {item.desc}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section wrapper with staggered mount animation ───────────────────────────

function Section({ delay, children, style = {}, sectionId }) {
  return (
    <motion.div
      data-section={sectionId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'white', borderRadius: 18,
        border: '1.5px solid #EBEBEB',
        padding: '24px 26px', marginBottom: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        ...style
      }}
    >
      {children}
    </motion.div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 15, fontWeight: 700, color: '#111',
      marginBottom: 16, ...FONT,
      display: 'flex', alignItems: 'center', gap: 8
    }}>
      {children}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Tab1Style() {
  const { wedding, update } = useWedding()
  const [newEventName, setNewEventName] = useState('')
  const [newEventEmoji, setNewEventEmoji] = useState('🎉')

  // ── Date handler ─────────────────────────────────────────────────────────────
  const handleDateChange = (e) => {
    const date = e.target.value
    const d = new Date(date)
    const dow = d.getDay()
    update('wedding_date', date)
    update('is_weekend', dow === 0 || dow === 6)
    scrollToNextSection('wedding-date', 420)
  }

  // ── Wedding type ─────────────────────────────────────────────────────────────
  const handleTypeToggle = (id) => {
    const newVal = wedding.wedding_type === id ? '' : id
    update('wedding_type', newVal)
    if (newVal) scrollToNextSection('wedding-type', 420)
  }

  // ── Budget style ─────────────────────────────────────────────────────────────
  const handleBudgetToggle = (id) => {
    const newVal = wedding.budget_tier === id ? '' : id
    update('budget_tier', newVal)
    if (newVal) scrollToNextSection('budget-style', 420)
  }

  // ── Events ──────────────────────────────────────────────────────────────────
  const handleEventToggle = (id) => {
    const opt = EVENT_OPTIONS.find(e => e.id === id)
    if (opt?.isCustom) {
      const custEvs = wedding.custom_events || []
      if (!custEvs.find(e => e.id === id)) {
        update('custom_events', [...custEvs, { id, label: opt.label, emoji: opt.icon }])
      }
    }
    const cur = wedding.events || []
    update('events', cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id])
  }

  const addCustomEvent = () => {
    const name = newEventName.trim()
    if (!name) return
    const id = 'custom_' + Date.now()
    const cur = wedding.custom_events || []
    if (cur.find(e => e.label.toLowerCase() === name.toLowerCase())) return
    update('custom_events', [...cur, { id, label: name, emoji: newEventEmoji }])
    update('events', [...(wedding.events || []), id])
    setNewEventName('')
    setNewEventEmoji('🎉')
  }

  const removeCustomEvent = (id) => {
    update('custom_events', (wedding.custom_events || []).filter(e => e.id !== id))
    update('events', (wedding.events || []).filter(ev => ev !== id))
  }

  const allEventOptions = [
    ...EVENT_OPTIONS,
    ...(wedding.custom_events || [])
      .filter(ev => !EVENT_OPTIONS.find(o => o.id === ev.id))
      .map(ev => ({ id: ev.id, icon: ev.emoji, label: ev.label, isUserCustom: true }))
  ]

  const today = new Date().toISOString().split('T')[0]
  const selectedEvents = wedding.events || []

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', ...FONT }}>

      {/* ── Section 1: Date ── */}
      <Section delay={0} sectionId="wedding-date">
        <SectionTitle>📅 Wedding Date</SectionTitle>
        <input
          type="date"
          value={wedding.wedding_date || ''}
          min={today}
          onChange={handleDateChange}
          style={{
            padding: '10px 16px', border: '1.5px solid #EBEBEB',
            borderRadius: 10, fontSize: 15, color: '#111',
            background: '#fff', cursor: 'pointer', ...FONT,
            fontWeight: 600
          }}
        />
        {wedding.wedding_date && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', borderRadius: 8,
              background: wedding.is_weekend ? '#FEF3C7' : '#DCFCE7',
              color: wedding.is_weekend ? '#92400E' : '#166534',
              fontSize: 12, fontWeight: 700, ...FONT
            }}
          >
            {wedding.is_weekend ? '⚠️ Weekend — +15% surcharge applies' : '✅ Weekday — Regular pricing'}
          </motion.div>
        )}
      </Section>

      {/* ── Section 2: Wedding Type ── */}
      <Section delay={0.08} sectionId="wedding-type" style={{ background: '#ffffff' }}>
        <SectionTitle>💒 Wedding Type</SectionTitle>
        <div className="selection-grid wedding-type-grid" style={{
          display: 'grid',
          gap: 10
        }}>
          {WEDDING_TYPE_OPTIONS.map(opt => (
            <SelCard
              key={opt.id}
              item={opt}
              isSelected={wedding.wedding_type === opt.id}
              onToggle={handleTypeToggle}
              hasAnySelected={!!wedding.wedding_type && wedding.wedding_type !== opt.id}
            />
          ))}
        </div>
      </Section>

      {/* ── Section 3: Budget Style ── */}
      <Section delay={0.16} sectionId="budget-style">
        <SectionTitle>💎 Budget Style</SectionTitle>
        <div className="budget-style-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {BUDGET_STYLE_OPTIONS.map(opt => (
            <SelCard
              key={opt.id}
              item={opt}
              isSelected={wedding.budget_tier === opt.id}
              onToggle={handleBudgetToggle}
              hasAnySelected={!!wedding.budget_tier && wedding.budget_tier !== opt.id}
              wide
            />
          ))}
        </div>
      </Section>

      {/* ── Section 4: Events ── */}
      <Section delay={0.24} sectionId="events">
        <SectionTitle>🎉 Events &amp; Ceremonies</SectionTitle>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 14, ...FONT }}>
          Select all events you'll celebrate — multi-select
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 10, marginBottom: 16
        }}>
          {allEventOptions.map(opt => {
            const isSel = selectedEvents.includes(opt.id)
            const isUserCustom = opt.isUserCustom
            return (
              <div key={opt.id} style={{ position: 'relative' }}>
                <div
                  onClick={() => handleEventToggle(opt.id)}
                  className={`sel-card${isSel ? ' selected' : ''}`}
                  style={{
                    border: `2px solid ${isSel ? '#D4537E' : '#EBEBEB'}`,
                    borderRadius: 14, padding: '18px 10px',
                    background: isSel ? '#FDF2F8' : 'white',
                    textAlign: 'center', userSelect: 'none',
                    boxShadow: isSel ? '0 4px 16px rgba(212,83,126,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="check-badge-rose" style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#D4537E', color: 'white',
                    fontSize: 11, fontWeight: 800,
                    alignItems: 'center', justifyContent: 'center',
                    display: isSel ? 'flex' : 'none',
                    animation: isSel ? 'checkSpring 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
                  }}>✓</div>
                  <div className="sel-card-icon" style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>{opt.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: isSel ? '#B83A64' : '#111' }}>{opt.label}</div>
                </div>
                {isUserCustom && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCustomEvent(opt.id) }}
                    style={{
                      position: 'absolute', top: -6, left: -6,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#fee2e2', border: 'none', color: '#dc2626',
                      fontSize: 10, fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1, zIndex: 3
                    }}
                  >×</button>
                )}
              </div>
            )
          })}
        </div>

        {/* Selected summary */}
        {selectedEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '10px 16px', borderRadius: 10,
              background: '#FBE8EF', border: '1px solid #F2C4D4',
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 16, fontSize: 12, fontWeight: 700, color: '#B83A64'
            }}
          >
            🎊 {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} selected —{' '}
            {allEventOptions.filter(o => selectedEvents.includes(o.id)).slice(0, 4).map(o => o.icon).join(' ')}
            {selectedEvents.length > 4 && ` +${selectedEvents.length - 4} more`}
          </motion.div>
        )}

        {/* Add custom event */}
        <div style={{
          padding: '16px 18px', border: '1.5px dashed #EBEBEB',
          borderRadius: 12, background: '#ffffff'
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 10 }}>
            + Add your own event
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {EVENT_EMOJIS.map(em => (
                <button key={em} onClick={() => setNewEventEmoji(em)}
                  style={{
                    width: 30, height: 30,
                    border: `1.5px solid ${newEventEmoji === em ? '#D4537E' : '#EBEBEB'}`,
                    borderRadius: 7, background: newEventEmoji === em ? '#FBE8EF' : 'white',
                    cursor: 'pointer', fontSize: 15
                  }}>{em}</button>
              ))}
            </div>
            <input
              value={newEventName}
              onChange={e => setNewEventName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomEvent()}
              placeholder="e.g. Ring Ceremony, Tilak, Griha Pravesh…"
              style={{
                flex: 1, minWidth: 180, padding: '8px 12px',
                border: '1.5px solid #EBEBEB', borderRadius: 8,
                fontSize: 13, outline: 'none', background: '#fff', color: '#111', ...FONT
              }}
            />
            <button
              onClick={addCustomEvent}
              style={{
                padding: '8px 18px', borderRadius: 8, background: '#111',
                color: 'white', border: 'none', fontWeight: 700,
                fontSize: 12, cursor: 'pointer', ...FONT
              }}
            >Add</button>
          </div>
        </div>
      </Section>

      {/* ── Sticky Next button ── */}
      {selectedEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'sticky', bottom: '1.5rem',
            display: 'flex', justifyContent: 'center',
            zIndex: 50, marginTop: '2rem'
          }}
        >
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('weddingNextTab'))}
            style={{
              background: '#111', color: '#fff',
              border: 'none', borderRadius: '10px',
              padding: '14px 40px', fontSize: '15px',
              fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}
          >
            Next: Venue &amp; Guests →
          </button>
        </motion.div>
      )}

      {/* ── Summary bar ── */}
      {(wedding.wedding_type || wedding.budget_tier || selectedEvents.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px 22px', borderRadius: 14,
            background: 'linear-gradient(135deg, #FBE8EF, #fff)',
            border: '1.5px solid #F2C4D4',
            display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center'
          }}
        >
          {wedding.wedding_type && (
            <span style={{
              padding: '5px 12px', borderRadius: 20,
              background: '#D4537E', color: 'white',
              fontSize: 12, fontWeight: 700
            }}>💒 {wedding.wedding_type}</span>
          )}
          {wedding.budget_tier && (
            <span style={{
              padding: '5px 12px', borderRadius: 20,
              background: '#111', color: 'white',
              fontSize: 12, fontWeight: 700
            }}>
              {BUDGET_STYLE_OPTIONS.find(b => b.id === wedding.budget_tier)?.icon} {wedding.budget_tier}
            </span>
          )}
          {selectedEvents.length > 0 && (
            <span style={{
              padding: '5px 12px', borderRadius: 20,
              background: '#FDE8F0', color: '#B83A64',
              border: '1px solid #F2C4D4',
              fontSize: 12, fontWeight: 700
            }}>🎉 {selectedEvents.length} events</span>
          )}
          <span style={{ fontSize: 12, color: '#888', marginLeft: 'auto', ...FONT }}>
            {[wedding.wedding_type, wedding.budget_tier, selectedEvents.length > 0].filter(Boolean).length}/3 sections complete
          </span>
        </motion.div>
      )}
    </div>
  )
}
