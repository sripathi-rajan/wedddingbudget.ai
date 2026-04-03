import { useMemo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useWedding, VENUE_TYPES, HOTEL_TIERS, ALL_EVENTS, INDIA_STATES_DISTRICTS, getMandapams, formatRupees } from '../context/WeddingContext'
import { MultiImageSelector, SingleImageSelector } from '../components/ImageCard'
import { scrollToNextSection } from '../utils/scrollToNext'

// Staggered section reveal
const sectionStyle = (i) => ({
  animation: `sectionReveal 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms both`
})

const C = { primary: '#023047', amber: '#ffb703', blue: '#219ebc', light: '#e8f4fa', sky: '#8ecae6' }

function StateCitySelector({ stateKey, districtKey, label, wedding, update, onDistrictSelect }) {
  const states = Object.keys(INDIA_STATES_DISTRICTS).sort()
  const districts = wedding[stateKey] ? INDIA_STATES_DISTRICTS[wedding[stateKey]] || [] : []
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div>
        <label className="form-label">{label} — State</label>
        <select className="form-select" value={wedding[stateKey] || ''}
          onChange={e => { update(stateKey, e.target.value); update(districtKey, '') }}>
          <option value="">-- Select State --</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">{label} — District / City</label>
        <select className="form-select" value={wedding[districtKey] || ''}
          disabled={!wedding[stateKey]}
          onChange={e => {
            update(districtKey, e.target.value)
            if (districtKey === 'wedding_district') update('wedding_city', e.target.value)
            if (districtKey === 'bride_district') update('bride_hometown', e.target.value)
            if (districtKey === 'groom_district') update('groom_hometown', e.target.value)
            if (e.target.value) onDistrictSelect?.()
          }}>
          <option value="">-- Select District --</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
    </div>
  )
}

function MandapamCard({ venue, isSelected, onSelect, hasAnySelected }) {
  return (
    <div
      onClick={() => onSelect(venue)}
      className={`sel-card${isSelected ? ' selected' : ''}${hasAnySelected && !isSelected ? ' dimmed' : ''}`}
      style={{
        border: `2px solid ${isSelected ? '#D4537E' : C.sky}`,
        borderRadius: 14, padding: '16px 18px',
        background: isSelected ? '#FDF2F8' : 'white',
        boxShadow: isSelected ? '0 4px 20px rgba(212,83,126,0.12)' : 'none',
      }}
    >
      {/* Rose checkmark badge */}
      <div style={{
        position: 'absolute', top: 10, right: 12,
        background: '#D4537E', color: 'white', borderRadius: '50%',
        width: 22, height: 22, alignItems: 'center',
        justifyContent: 'center', fontWeight: 800, fontSize: 13,
        display: isSelected ? 'flex' : 'none',
        animation: isSelected ? 'checkSpring 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
        boxShadow: '0 2px 8px rgba(212,83,126,0.4)'
      }}>✓</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? '#B83A64' : C.primary, marginBottom: 4 }}>{venue.name}</div>
      <div style={{ fontSize: 12, color: C.blue, fontWeight: 500, marginBottom: 6 }}>📍 {venue.area}</div>
      <div style={{ display: 'flex', gap: 10, fontSize: 12, flexWrap: 'wrap' }}>
        <span style={{ background: C.light, padding: '2px 8px', borderRadius: 6, color: C.primary, fontWeight: 600 }}>
          👥 Up to {venue.capacity.toLocaleString()} guests
        </span>
        <span style={{ background: isSelected ? '#FBE8EF' : '#fff8e1', padding: '2px 8px', borderRadius: 6, color: isSelected ? '#B83A64' : '#7a5900', fontWeight: 700 }}>
          {formatRupees(venue.cost_per_day)}/day
        </span>
      </div>
    </div>
  )
}

export default function Tab2Venue() {
  const { wedding, update, updateMany } = useWedding()
  const [showMaps, setShowMaps] = useState(false)
  const [customVenue, setCustomVenue] = useState({ name: '', area: '', capacity: '', cost_per_day: '' })
  const [showCustomForm, setShowCustomForm] = useState(false)

  const tier = HOTEL_TIERS.find(t => t.id === wedding.hotel_tier)
  const ppr = tier ? tier.ppr : 2
  const autoRooms = Math.ceil((wedding.outstation_guests || 0) / ppr)

  // Auto-set rooms when outstation_guests or hotel_tier changes, unless user has overridden
  useEffect(() => {
    if (!wedding.num_rooms_override) {
      update('num_rooms', autoRooms)
    }
  }, [autoRooms, wedding.num_rooms_override])

  const mandapams = useMemo(() => getMandapams(wedding.wedding_district), [wedding.wedding_district])

  const handleMandapamSelect = (venue) => {
    updateMany({
      mandapam_id: venue.id,
      mandapam_name: venue.name,
      mandapam_cost_per_day: venue.cost_per_day,
    })
  }

  const mapsUrl = wedding.wedding_district
    ? `https://www.google.com/maps/search/mandapam+wedding+venue+${encodeURIComponent(wedding.wedding_district)}`
    : null

  return (
    <div>
      {/* Venue Type */}
      <div className="section-card" style={sectionStyle(0)} data-section="venue-type">
        <div className="section-title">🏛️ Venue Type</div>
        <SingleImageSelector items={VENUE_TYPES} selected={wedding.venue_type}
          onChange={(v) => { update('venue_type', v); scrollToNextSection('venue-type', 420) }} />
      </div>

      {/* Wedding City */}
      <div className="section-card" style={sectionStyle(1)} data-section="wedding-city">
        <div className="section-title">📍 Wedding City</div>
        <StateCitySelector stateKey="wedding_state" districtKey="wedding_district"
          label="Wedding Location" wedding={wedding} update={update}
          onDistrictSelect={() => scrollToNextSection('wedding-city', 420)} />
        {wedding.wedding_district && (
          <div style={{ marginTop: 12, padding: '8px 14px', background: C.light,
            borderRadius: 10, fontSize: 13, color: C.primary, fontWeight: 600, display: 'inline-flex', gap: 8 }}>
            📍 {wedding.wedding_district}, {wedding.wedding_state}
          </div>
        )}
      </div>

      {/* Mandapam Picker */}
      {wedding.wedding_district && (
        <div className="section-card" data-section="mandapam-picker">
          <div className="section-title">🏟️ Select Mandapam / Venue Hall</div>
          <div style={{ fontSize: 13, color: '#4a7a94', marginBottom: 16 }}>
            Popular venues in {wedding.wedding_district}. Prices are market estimates — verify directly with venue.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
            {mandapams.map(v => (
              <MandapamCard key={v.id} venue={v}
                isSelected={wedding.mandapam_id === v.id}
                hasAnySelected={!!wedding.mandapam_id && wedding.mandapam_id !== v.id}
                onSelect={handleMandapamSelect} />
            ))}
          </div>

          {wedding.mandapam_id && (
            <div style={{ marginTop: 8 }}>
              <div style={{ marginBottom: 10 }}>
                <label className="form-label">Number of Days / Events</label>
                <input className="form-input" type="number" min={1} max={10}
                  style={{ maxWidth: 120 }}
                  value={wedding.num_days || 1}
                  onChange={e => update('num_days', parseInt(e.target.value) || 1)} />
              </div>
              <div style={{ padding: '12px 16px', background: '#fff8e1',
                borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600, color: C.primary }}>Mandapam Total Cost</span>
                  <div style={{ fontSize: 11, color: '#7a5900', marginTop: 2 }}>
                    {formatRupees(wedding.mandapam_cost_per_day || 0)}/day × {wedding.num_days || 1} day(s) — Admin-set price
                  </div>
                </div>
                <span style={{ fontFamily: 'EB Garamond, serif', fontSize: 22, fontWeight: 800, color: '#7a5900' }}>
                  {formatRupees((wedding.mandapam_cost_per_day || 0) * (wedding.num_days || 1))}
                </span>
              </div>
            </div>
          )}

          {mapsUrl && (
            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', background: C.light, borderRadius: 10,
                  color: C.primary, fontWeight: 600, fontSize: 13, textDecoration: 'none',
                  border: `1.5px solid ${C.sky}` }}>
                🗺️ Find more venues on Google Maps
              </a>
              <button onClick={() => setShowCustomForm(v => !v)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', background: '#fffbea', borderRadius: 10,
                  color: '#7a5900', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  border: `1.5px solid ${C.amber}` }}>
                {showCustomForm ? '✕ Cancel' : '+ Add Venue from Maps'}
              </button>
            </div>
          )}
          {showCustomForm && (
            <div style={{ marginTop: 14, padding: '16px 18px', background: '#fffbea',
              borderRadius: 12, border: `1.5px solid ${C.amber}` }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.primary, marginBottom: 12 }}>
                Add Custom Venue Found on Google Maps
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Venue Name</label>
                  <input className="form-input" placeholder="e.g. Sri Devi Mahal"
                    value={customVenue.name}
                    onChange={e => setCustomVenue(v => ({ ...v, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Area / Location</label>
                  <input className="form-input" placeholder="e.g. Anna Nagar"
                    value={customVenue.area}
                    onChange={e => setCustomVenue(v => ({ ...v, area: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Capacity (guests)</label>
                  <input className="form-input" type="number" placeholder="e.g. 500"
                    value={customVenue.capacity}
                    onChange={e => setCustomVenue(v => ({ ...v, capacity: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Cost per Day (₹) — From venue directly</label>
                  <input className="form-input" type="number" placeholder="e.g. 150000"
                    value={customVenue.cost_per_day}
                    onChange={e => setCustomVenue(v => ({ ...v, cost_per_day: e.target.value }))} />
                </div>
              </div>
              <button
                disabled={!customVenue.name || !customVenue.cost_per_day}
                onClick={() => {
                  const cpd = parseInt(customVenue.cost_per_day) || 0
                  updateMany({
                    mandapam_id: 'custom_' + Date.now(),
                    mandapam_name: customVenue.name,
                    mandapam_cost_per_day: cpd,
                  })
                  setShowCustomForm(false)
                  setCustomVenue({ name: '', area: '', capacity: '', cost_per_day: '' })
                }}
                style={{ marginTop: 12, padding: '10px 22px', borderRadius: 10, border: 'none',
                  background: customVenue.name && customVenue.cost_per_day
                    ? 'linear-gradient(135deg,#ffb703,#fb8500)' : '#ccc',
                  color: '#023047', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                ✓ Use This Venue
              </button>
            </div>
          )}
        </div>
      )}

      {/* Guests & Capacity */}
      <div className="section-card" data-section="guest-count">
        <div className="section-title">👥 Guests & Capacity</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 20 }}>
          <div style={{ background: C.light, borderRadius: 12, padding: 16 }}>
            <label className="form-label" style={{ color: C.primary }}>Total Guests</label>
            <div style={{ fontSize: 11, color: C.blue, marginBottom: 10, fontWeight: 500 }}>Across all events combined</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <input type="range" min={50} max={2000} step={50}
                value={wedding.total_guests || 50}
                onChange={e => update('total_guests', parseInt(e.target.value))}
                style={{ flex: 1, accentColor: '#D4537E', cursor: 'pointer' }} />
              <input type="number" value={wedding.total_guests || ''}
                onChange={e => update('total_guests', parseInt(e.target.value) || 0)}
                style={{ width: 80, textAlign: 'center', padding: '6px 8px',
                  border: '1.5px solid #EBEBEB', borderRadius: 8, fontSize: 14,
                  fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {[100, 200, 300, 500, 750, 1000].map(n => {
                const sel = wedding.total_guests === n
                return (
                  <button key={n} onClick={() => update('total_guests', n)}
                    style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', border: `1.5px solid ${sel ? '#D4537E' : '#EBEBEB'}`,
                      background: sel ? '#FDF2F8' : 'white', color: sel ? '#D4537E' : '#555',
                      transition: 'all 0.15s' }}>
                    {n}
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize: 12, color: '#D4537E', fontWeight: 600 }}>
              {(wedding.total_guests || 0) < 150 ? '🌿 Intimate gathering'
                : (wedding.total_guests || 0) < 400 ? '✨ Mid-size wedding'
                : (wedding.total_guests || 0) < 700 ? '💐 Large wedding'
                : '👑 Grand wedding'}
            </div>
          </div>
          <div style={{ background: '#f0fdfa', borderRadius: 12, padding: 16 }}>
            <label className="form-label" style={{ color: '#065F46' }}>Seating Capacity Required</label>
            <div style={{ fontSize: 11, color: '#059669', marginBottom: 8, fontWeight: 500 }}>Maximum at any single event</div>
            <input type="number" className="form-input" value={wedding.seating_capacity || ''}
              min={1} max={10000} placeholder="e.g. 300"
              onChange={e => update('seating_capacity', parseInt(e.target.value) || 0)} />
          </div>
          <div style={{ background: '#fffbea', borderRadius: 12, padding: 16 }}>
            <label className="form-label" style={{ color: '#7a5900' }}>Outstation Guests</label>
            <div style={{ fontSize: 11, color: '#b37f00', marginBottom: 8, fontWeight: 500 }}>Guests needing accommodation</div>
            <input type="number" className="form-input" value={wedding.outstation_guests || ''}
              min={0} max={wedding.total_guests || 10000} placeholder="e.g. 80"
              onChange={e => update('outstation_guests', parseInt(e.target.value) || 0)} />
          </div>
        </div>

        {/* Per-event breakdown */}
        {wedding.events.length > 0 && (
          <div>
            <div className="form-label" style={{ marginBottom: 12, fontSize: 14 }}>
              Guests Per Event (optional)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 12 }}>
              {wedding.events.map(ev => {
                const evObj = ALL_EVENTS.find(e => e.id === ev)
                return (
                  <div key={ev} style={{ background: 'white', borderRadius: 12, padding: '12px 14px',
                    border: `1.5px solid ${C.sky}` }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{evObj?.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: C.primary }}>{ev}</div>
                    <input type="number" className="form-input" style={{ padding: '7px 10px', fontSize: 13 }}
                      placeholder={`~${wedding.total_guests || 0}`}
                      value={wedding.guest_counts_by_event?.[ev] || ''}
                      onChange={e => update('guest_counts_by_event', {
                        ...wedding.guest_counts_by_event, [ev]: parseInt(e.target.value) || 0
                      })} />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Accommodation */}
      <div className="section-card" data-section="accommodation">
        <div className="section-title">🛏️ Accommodation</div>
        <SingleImageSelector items={HOTEL_TIERS} selected={wedding.hotel_tier}
          onChange={(v) => { update('hotel_tier', v); scrollToNextSection('accommodation', 420) }} showCost />

        {wedding.hotel_tier && (wedding.outstation_guests || 0) > 0 && (
          <div style={{ marginTop: 16, padding: '14px 18px', background: '#e8f8f5',
            borderRadius: 12, border: `1.5px solid #6EE7B7` }}>
            <div style={{ fontWeight: 700, color: '#065F46', fontSize: 14, marginBottom: 10 }}>
              🏨 Rooms Calculation
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
              <div>
                <div style={{ fontSize: 12, color: '#047857', marginBottom: 6 }}>
                  Auto: {wedding.outstation_guests} guests ÷ {ppr}/room = {autoRooms} rooms
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>Rooms Needed:</label>
                  <input type="number" min={1}
                    value={wedding.num_rooms || autoRooms}
                    onChange={e => {
                      update('num_rooms', parseInt(e.target.value) || autoRooms)
                      update('num_rooms_override', true)
                    }}
                    style={{ width: 80, padding: '6px 10px', border: `2px solid ${C.amber}`,
                      borderRadius: 8, fontSize: 14, fontWeight: 700, textAlign: 'center',
                      fontFamily: 'Inter, sans-serif' }} />
                  {wedding.num_rooms_override && (
                    <button onClick={() => { update('num_rooms_override', false); update('num_rooms', autoRooms) }}
                      style={{ fontSize: 11, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                      Reset to auto
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#047857', fontStyle: 'italic' }}>
                {wedding.num_rooms_override ? '✏️ Manually set' : '🤖 Auto-calculated'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bride & Groom Hometowns */}
      <div className="section-card" data-section="hometowns">
        <div className="section-title">🏠 Bride &amp; Groom Hometowns</div>
        <div style={{ fontSize: 12, color: '#4a7a94', marginBottom: 16 }}>
          Used to calculate logistics & travel distance for transfers.
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#b03060', marginBottom: 12 }}>
            👰 Bride's Hometown
          </div>
          <StateCitySelector stateKey="bride_state" districtKey="bride_district"
            label="Bride" wedding={wedding} update={update} />
        </div>
        <div style={{ borderTop: `1.5px dashed ${C.sky}`, paddingTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginBottom: 12 }}>
            🤵 Groom's Hometown
          </div>
          <StateCitySelector stateKey="groom_state" districtKey="groom_district"
            label="Groom" wedding={wedding} update={update} />
        </div>
      </div>

      {/* Sticky Next button */}
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
          Next: Decor AI →
        </button>
      </motion.div>
    </div>
  )
}
