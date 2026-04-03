import { useState } from 'react'
import { useWedding, ARTIST_TYPES, NAMED_ARTISTS, ALL_EVENTS, formatRupees } from '../context/WeddingContext'

const C = { primary: '#023047', amber: '#ffb703', blue: '#219ebc', light: '#e8f4fa', sky: '#8ecae6', orange: '#fb8500' }

const ARTIST_COST_MAP = {
  'Local DJ':              [60000,   200000],
  'Professional DJ':       [250000,  600000],
  'Celebrity DJ':          [800000,  2500000],
  'Bollywood Singer A':    [1000000, 1500000],
  'Bollywood Singer B':    [600000,  1000000],
  'Bollywood Singer C':    [300000,  600000],
  'Live Band (Local)':     [150000,  400000],
  'Live Band (National)':  [600000,  1800000],
  'Folk Artist':           [40000,   150000],
  'Sufi Singer':           [80000,   300000],
  'Myra Entertainment':    [250000,  700000],
  'Choreographer':         [60000,   250000],
  'Anchor / Emcee':        [40000,   200000],
  'Stand-up Comedian':     [100000,  500000],
  'Nadaswaram Artist':     [25000,   80000],
  'Fireworks Display':     [50000,   300000],
}

function ArtistCard({ artist, isSelected, onToggle }) {
  const [imgErr, setImgErr] = useState(false)
  const [lo, hi] = ARTIST_COST_MAP[artist.id] || [0, 0]

  return (
    <div onClick={() => onToggle(artist)}
      style={{ border: `2px solid ${isSelected ? C.amber : C.sky}`,
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        background: isSelected ? '#fffbea' : 'white',
        boxShadow: isSelected ? `0 0 0 3px rgba(255,183,3,0.2)` : 'none',
        transition: 'all 0.2s', position: 'relative' }}>
      {artist.imageUrl && !imgErr ? (
        <img src={artist.imageUrl} alt={artist.label}
          onError={() => setImgErr(true)}
          style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ fontSize: 40, textAlign: 'center', padding: '20px 0 14px',
          background: `linear-gradient(135deg, ${C.light}, #fffbea)` }}>
          {artist.emoji}
        </div>
      )}
      <div style={{ padding: '12px 14px 14px', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: C.primary }}>{artist.label}</div>
        <div style={{ fontSize: 12, color: C.blue, fontWeight: 700 }}>
          {formatRupees(lo)} – {formatRupees(hi)}
        </div>
      </div>
      {isSelected && (
        <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24,
          background: C.amber, borderRadius: '50%', color: C.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 'bold', boxShadow: `0 2px 8px rgba(255,183,3,0.5)` }}>✓</div>
      )}
    </div>
  )
}

function ArtistEventForm({ artist, wedding, onUpdate }) {
  const events = wedding.events || []
  const details = wedding.artist_events?.[artist.id] || {}

  const set = (key, val) => {
    const cur = { ...(wedding.artist_events || {}) }
    cur[artist.id] = { ...details, [key]: val }
    onUpdate('artist_events', cur)
  }

  const [lo, hi] = ARTIST_COST_MAP[artist.id] || [0, 0]
  const negotiated = details.negotiated_cost || ''

  return (
    <div style={{ background: C.light, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 24 }}>{artist.emoji}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.primary }}>{artist.label}</div>
          <div style={{ fontSize: 12, color: C.blue }}>Budget range: {formatRupees(lo)} – {formatRupees(hi)}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.primary, display: 'block', marginBottom: 4 }}>
            Assigned Event
          </label>
          <select value={details.event_id || ''}
            onChange={e => set('event_id', e.target.value)}
            style={{ width: '100%', padding: '7px 10px', border: `1.5px solid ${C.sky}`,
              borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif', background: 'white', color: C.primary }}>
            <option value="">-- Select Event --</option>
            {events.map(ev => {
              const evObj = ALL_EVENTS.find(e => e.id === ev)
              return <option key={ev} value={ev}>{evObj?.emoji} {ev}</option>
            })}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.primary, display: 'block', marginBottom: 4 }}>
            Performance Date
          </label>
          <input type="date"
            value={details.event_date || ''}
            min={wedding.wedding_date || undefined}
            onChange={e => set('event_date', e.target.value)}
            style={{ width: '100%', padding: '7px 10px', border: `1.5px solid ${C.sky}`,
              borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.primary, display: 'block', marginBottom: 4 }}>
            Start Time
          </label>
          <input type="time"
            value={details.start_time || ''}
            onChange={e => set('start_time', e.target.value)}
            style={{ width: '100%', padding: '7px 10px', border: `1.5px solid ${C.sky}`,
              borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.primary, display: 'block', marginBottom: 4 }}>
            Duration (hours)
          </label>
          <input type="number" min={0.5} max={8} step={0.5}
            value={details.duration_hrs || ''}
            placeholder="e.g. 2"
            onChange={e => set('duration_hrs', parseFloat(e.target.value) || 0)}
            style={{ width: '100%', padding: '7px 10px', border: `1.5px solid ${C.sky}`,
              borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.primary, display: 'block', marginBottom: 4 }}>
            Venue / Stage
          </label>
          <input type="text"
            value={details.venue_name || ''}
            placeholder="e.g. Main Stage, Lawn A"
            onChange={e => set('venue_name', e.target.value)}
            style={{ width: '100%', padding: '7px 10px', border: `1.5px solid ${C.sky}`,
              borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.primary, display: 'block', marginBottom: 4 }}>
            Expected Audience
          </label>
          <input type="number" min={0}
            value={details.audience_count || ''}
            placeholder={`${wedding.total_guests || 0}`}
            onChange={e => set('audience_count', parseInt(e.target.value) || 0)}
            style={{ width: '100%', padding: '7px 10px', border: `1.5px solid ${C.sky}`,
              borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.primary, display: 'block', marginBottom: 4 }}>
            Negotiated Fee (₹)
          </label>
          <input type="number" min={0}
            value={negotiated}
            placeholder={`${Math.round((lo+hi)/2)}`}
            onChange={e => set('negotiated_cost', parseInt(e.target.value) || 0)}
            style={{ width: '100%', padding: '7px 10px', border: `1.5px solid ${C.amber}`,
              borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 700 }} />
        </div>
      </div>
    </div>
  )
}

export default function Tab5Artists() {
  const { wedding, update } = useWedding()
  const [selected, setSelected] = useState([])
  const [namedArtistBookings, setNamedArtistBookings] = useState([])  // [{namedId, negotiated}]

  const toggle = (artist) => {
    const exists = selected.find(s => s.id === artist.id)
    let next
    if (exists) next = selected.filter(s => s.id !== artist.id)
    else next = [...selected, artist]
    setSelected(next)

    const costs = next.map(a => {
      const det = wedding.artist_events?.[a.id]
      if (det?.negotiated_cost) return det.negotiated_cost
      const [lo, hi] = ARTIST_COST_MAP[a.id] || [0, 0]
      return (lo + hi) / 2
    })
    update('artists_total', costs.reduce((a, b) => a + b, 0))
    update('selected_artists', next.map(a => a.id))
  }

  const toggleNamedArtist = (artist) => {
    const exists = namedArtistBookings.find(b => b.namedId === artist.id)
    if (exists) setNamedArtistBookings(nb => nb.filter(b => b.namedId !== artist.id))
    else setNamedArtistBookings(nb => [...nb, { namedId: artist.id, negotiated: 0 }])
  }

  const setNamedFee = (namedId, fee) => {
    setNamedArtistBookings(nb => nb.map(b => b.namedId === namedId ? {...b, negotiated: fee} : b))
  }

  // Recalculate total considering negotiated costs
  const total = selected.reduce((sum, a) => {
    const det = wedding.artist_events?.[a.id]
    if (det?.negotiated_cost) return sum + det.negotiated_cost
    const [lo, hi] = ARTIST_COST_MAP[a.id] || [0, 0]
    return sum + (lo + hi) / 2
  }, 0) + namedArtistBookings.reduce((s, b) => {
    if (b.negotiated) return s + b.negotiated
    const na = NAMED_ARTISTS.find(a => a.id === b.namedId)
    return s + (na ? (na.fee_low + na.fee_high) / 2 : 0)
  }, 0)

  return (
    <div>
      {/* Named/Celebrity Artists */}
      <div className="section-card">
        <div className="section-title">⭐ Named / Celebrity Artists</div>
        <div style={{ fontSize: 13, color: '#4a7a94', marginBottom: 14 }}>
          Book specific artists by name. Fee ranges are admin-maintained and reflect current market rates.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {NAMED_ARTISTS.map(na => {
            const isBooked = !!namedArtistBookings.find(b => b.namedId === na.id)
            const booking = namedArtistBookings.find(b => b.namedId === na.id)
            return (
              <div key={na.id} style={{ border: `2px solid ${isBooked ? C.amber : C.sky}`, borderRadius: 14,
                background: isBooked ? '#fffbea' : 'white', padding: 14, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.primary }}>{na.name}</div>
                    <div style={{ fontSize: 11, color: C.blue, fontWeight: 600 }}>{na.genre}</div>
                    <div style={{ fontSize: 12, color: '#7a5900', marginTop: 2 }}>
                      {formatRupees(na.fee_low)} – {formatRupees(na.fee_high)}
                    </div>
                  </div>
                  <button onClick={() => toggleNamedArtist(na)}
                    style={{ padding: '5px 12px', borderRadius: 10,
                      background: isBooked ? '#dc2626' : `linear-gradient(135deg, ${C.amber}, ${C.orange})`,
                      border: 'none', color: isBooked ? 'white' : C.primary,
                      fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    {isBooked ? '✕ Remove' : '+ Book'}
                  </button>
                </div>
                {isBooked && (
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 11, color: C.primary, fontWeight: 600 }}>Negotiated Fee (₹):</label>
                    <input type="number" min={0}
                      value={booking?.negotiated || ''}
                      placeholder={`${Math.round((na.fee_low + na.fee_high) / 2)}`}
                      onChange={e => setNamedFee(na.id, parseInt(e.target.value) || 0)}
                      style={{ width: '100%', marginTop: 4, padding: '5px 8px',
                        border: `1.5px solid ${C.amber}`, borderRadius: 8, fontSize: 12,
                        fontFamily: 'Inter,sans-serif', fontWeight: 700 }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Generic Artist Types */}
      <div className="section-card">
        <div className="section-title">🎤 Artists & Entertainment</div>
        <div style={{ fontSize: 13, color: '#4a7a94', marginBottom: 14 }}>
          Select artist types for unnamed/generic bookings. Set negotiated fees in the schedule below.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14 }}>
          {ARTIST_TYPES.map(artist => (
            <ArtistCard key={artist.id} artist={artist}
              isSelected={!!selected.find(s => s.id === artist.id)}
              onToggle={toggle} />
          ))}
        </div>
      </div>

      {(selected.length > 0 || namedArtistBookings.length > 0) && (
        <>
          {/* Artist Event Details */}
          <div className="section-card">
            <div className="section-title">📋 Artist Schedule & Details</div>
            <div style={{ fontSize: 13, color: '#4a7a94', marginBottom: 16 }}>
              Assign each artist to an event, set the date, timing, venue, and expected audience.
            </div>
            {selected.map(a => (
              <ArtistEventForm key={a.id} artist={a} wedding={wedding} onUpdate={update} />
            ))}
          </div>

          {/* Entertainment Budget Summary */}
          <div className="section-card" style={{
            background: 'linear-gradient(135deg, #fffbea, #e8f4fa)',
            border: `2px solid ${C.amber}` }}>
            <div className="section-title" style={{ color: C.primary }}>🎊 Entertainment Budget</div>
            {namedArtistBookings.map(b => {
              const na = NAMED_ARTISTS.find(a => a.id === b.namedId)
              if (!na) return null
              const fee = b.negotiated || Math.round((na.fee_low + na.fee_high) / 2)
              return (
                <div key={b.namedId} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: `1px solid ${C.sky}`, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 22 }}>⭐</span>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: C.primary }}>{na.name}</span>
                      <div style={{ fontSize: 11, color: C.blue }}>{na.genre} • Named Artist</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, color: b.negotiated ? '#047857' : C.blue, fontWeight: 800 }}>
                    {formatRupees(fee)} {b.negotiated && <span style={{ fontSize: 11, fontWeight: 400 }}>negotiated</span>}
                  </div>
                </div>
              )
            })}
            {selected.map(a => {
              const det = wedding.artist_events?.[a.id]
              const fee = det?.negotiated_cost
              const [lo, hi] = ARTIST_COST_MAP[a.id] || [0, 0]
              return (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: `1px solid ${C.sky}`, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 22 }}>{a.emoji}</span>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: C.primary }}>{a.label}</span>
                      {det?.event_id && (
                        <div style={{ fontSize: 11, color: C.blue }}>
                          {ALL_EVENTS.find(e => e.id === det.event_id)?.emoji} {det.event_id}
                          {det.start_time ? ` · ${det.start_time}` : ''}
                          {det.duration_hrs ? ` · ${det.duration_hrs}hrs` : ''}
                          {det.audience_count ? ` · ${det.audience_count} audience` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {fee ? (
                      <div style={{ fontSize: 15, color: '#047857', fontWeight: 800 }}>
                        {formatRupees(fee)} <span style={{ fontSize: 11, fontWeight: 400 }}>negotiated</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: C.blue, fontWeight: 700 }}>
                        {formatRupees(lo)} – {formatRupees(hi)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 14,
              borderTop: `2px solid ${C.amber}` }}>
              <span style={{ fontFamily: 'EB Garamond, serif', fontSize: 20, fontWeight: 700, color: C.primary }}>
                Total Entertainment
              </span>
              <span style={{ fontFamily: 'EB Garamond, serif', fontSize: 28, fontWeight: 800, color: '#7a5900' }}>
                {formatRupees(total)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
