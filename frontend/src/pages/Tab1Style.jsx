import { useState } from 'react'
import { useWedding, WEDDING_TYPES, ALL_EVENTS, BUDGET_TIERS } from '../context/WeddingContext'
import { MultiImageSelector, SingleImageSelector } from '../components/ImageCard'

const C = { primary: '#023047', amber: '#ffb703', blue: '#219ebc', sky: '#8ecae6', light: '#e8f4fa', orange: '#fb8500' }

const EVENT_EMOJIS = ['🎉','🎊','🕯️','🎵','💃','🥂','🌸','🌺','🎭','🪔','🎇','🥁','👑','🌙','⭐','🎆']

export default function Tab1Style() {
  const { wedding, update } = useWedding()
  const [newEventName, setNewEventName] = useState('')
  const [newEventEmoji, setNewEventEmoji] = useState('🎉')

  const addCustomEvent = () => {
    const name = newEventName.trim()
    if (!name) return
    const id = 'custom_' + Date.now()
    const cur = wedding.custom_events || []
    if (cur.find(e => e.label.toLowerCase() === name.toLowerCase())) return
    update('custom_events', [...cur, { id, label: name, emoji: newEventEmoji }])
    setNewEventName('')
    setNewEventEmoji('🎉')
  }

  const removeCustomEvent = (id) => {
    update('custom_events', (wedding.custom_events || []).filter(e => e.id !== id))
    // also remove from events if selected
    update('events', (wedding.events || []).filter(ev => ev !== id))
  }

  const today = new Date().toISOString().split('T')[0]

  const handleDateChange = (e) => {
    const date = e.target.value
    const d = new Date(date)
    const dow = d.getDay()
    update('wedding_date', date)
    update('is_weekend', dow === 0 || dow === 6)
  }

  return (
    <div>
      {/* Wedding Date */}
      <div className="section-card">
        <div className="section-title">📅 Wedding Date</div>
        <input
          type="date"
          className="form-input"
          style={{ maxWidth: 280 }}
          value={wedding.wedding_date}
          min={today}
          onChange={handleDateChange}
        />
        {wedding.wedding_date && (
          <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 10, display: 'inline-flex',
            alignItems: 'center', gap: 8,
            background: wedding.is_weekend ? '#FEF3C7' : '#D1FAE5',
            color: wedding.is_weekend ? '#92400E' : '#065F46', fontSize: 13, fontWeight: 700 }}>
            {wedding.is_weekend ? '⚠️ Weekend — +15% surcharge applies' : '✅ Weekday — Regular pricing'}
          </div>
        )}
      </div>

      {/* Wedding Type */}
      <div className="section-card">
        <div className="section-title">🪔 Wedding Type</div>
        <SingleImageSelector items={WEDDING_TYPES} selected={wedding.wedding_type}
          onChange={(v) => update('wedding_type', v)} />
      </div>

      {/* Budget Style */}
      <div className="section-card">
        <div className="section-title">💰 Wedding Budget Style</div>
        <SingleImageSelector
          items={BUDGET_TIERS}
          selected={wedding.budget_tier}
          onChange={(v) => update('budget_tier', v)}
        />
      </div>

      {/* Events */}
      <div className="section-card">
        <div className="section-title">🎉 Wedding Events</div>
        <MultiImageSelector items={ALL_EVENTS} selected={wedding.events}
          onChange={(v) => update('events', v)} />

        {/* Custom Events */}
        {(wedding.custom_events || []).length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {(wedding.custom_events || []).map(ev => {
              const isSel = (wedding.events || []).includes(ev.id)
              return (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 20,
                  border: `2px solid ${isSel ? C.amber : C.sky}`,
                  background: isSel ? '#fffbea' : 'white', transition: 'all 0.2s' }}>
                  <span onClick={() => {
                    const cur = wedding.events || []
                    update('events', cur.includes(ev.id) ? cur.filter(x=>x!==ev.id) : [...cur, ev.id])
                  }} style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14, color: C.primary }}>
                    {ev.emoji} {ev.label}
                  </span>
                  <button onClick={() => removeCustomEvent(ev.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      color: '#dc2626', fontWeight: 'bold', fontSize: 14, padding: '0 2px' }}>×</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Custom Event */}
        <div style={{ marginTop: 18, padding: 16, background: C.light, borderRadius: 12,
          border: `1.5px dashed ${C.sky}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 10 }}>
            ➕ Add Your Own Event
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {EVENT_EMOJIS.map(em => (
                <button key={em} onClick={() => setNewEventEmoji(em)}
                  style={{ width: 32, height: 32, border: `2px solid ${newEventEmoji===em ? C.amber : C.sky}`,
                    borderRadius: 8, background: newEventEmoji===em ? '#fffbea' : 'white',
                    cursor: 'pointer', fontSize: 16 }}>{em}</button>
              ))}
            </div>
            <input
              value={newEventName}
              onChange={e => setNewEventName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomEvent()}
              placeholder="e.g. Ring Ceremony, Tilak, Griha Pravesh..."
              style={{ flex: 1, minWidth: 200, padding: '8px 12px',
                border: `1.5px solid ${C.sky}`, borderRadius: 10,
                fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
            <button onClick={addCustomEvent}
              style={{ padding: '8px 18px', borderRadius: 10,
                background: `linear-gradient(135deg, ${C.amber}, ${C.orange})`,
                border: 'none', color: C.primary, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Add Event
            </button>
          </div>
        </div>

        {wedding.events.length > 0 && (
          <div style={{ marginTop: 14, padding: '10px 16px', background: 'var(--primary-light)',
            borderRadius: 10, fontSize: 13, color: 'var(--primary-dark)', fontWeight: 600 }}>
            🎊 <strong>{wedding.events.length} events</strong> selected —{' '}
            {wedding.events.map(id => {
              const std = ALL_EVENTS.find(e => e.id === id)
              const cust = (wedding.custom_events || []).find(e => e.id === id)
              return (std?.emoji || cust?.emoji || '') + ' ' + (std?.label || cust?.label || id)
            }).join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}
