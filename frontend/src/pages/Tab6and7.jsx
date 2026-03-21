import { useEffect } from 'react'
import { useWedding, SFX_ITEMS, formatRupees } from '../context/WeddingContext'
import { MultiImageSelector } from '../components/ImageCard'

const C = { primary: '#023047', amber: '#ffb703', blue: '#219ebc', light: '#e8f4fa', sky: '#8ecae6', orange: '#fb8500' }

// ─── TAB 6: SUNDRIES ──────────────────────────────────────────────────────────
export function Tab6Sundries() {
  const { wedding, update } = useWedding()
  const guests = wedding.total_guests || 0
  const rooms  = wedding.num_rooms || Math.ceil((wedding.outstation_guests || 0) / 2)

  const defaultBasketRate   = { luxury: 2500, standard: 800, minimal: 300 }[wedding.room_basket_budget || 'standard']
  const defaultHamperRate   = { luxury: 3000, standard: 1000, minimal: 500 }[wedding.room_basket_budget || 'standard']

  const ritualCostBase = (wedding.events || []).reduce((s, e) => {
    if (e === 'Haldi')                return s + 10000
    if (e === 'Mehendi')              return s + 18000
    if (e === 'Wedding Day Ceremony') return s + 25000
    if (e === 'Engagement')           return s + 8000
    return s
  }, 0)

  const ov = wedding.sundry_overrides || {}
  const getVal = (key, def) => ov[key] !== undefined ? ov[key] : def
  const setOv = (key, val) => update('sundry_overrides', { ...ov, [key]: val })

  const basketQty   = getVal('basketQty',   rooms)
  const basketPrice = getVal('basketPrice',  defaultBasketRate)
  const hamperQty   = getVal('hamperQty',   guests)
  const hamperPrice = getVal('hamperPrice', defaultHamperRate)
  const ritualAmt   = getVal('ritualAmt',   ritualCostBase)
  const stationQty  = getVal('stationQty',  guests)
  const stationPP   = getVal('stationPP',   200)
  const photoVideo  = getVal('photoVideo',  80000)
  const makeupHair  = getVal('makeupHair',  50000)

  const basketTotal  = basketQty  * basketPrice
  const hamperTotal  = hamperQty  * hamperPrice
  const stationTotal = stationQty * stationPP
  const subTotal     = basketTotal + hamperTotal + ritualAmt + stationTotal + photoVideo + makeupHair
  const contingency  = Math.round(subTotal * 0.08)
  const sundryTotal  = subTotal + contingency

  const inp = (val, key, w=80) => (
    <input type="number" min={0} value={val}
      onChange={e => setOv(key, parseInt(e.target.value) || 0)}
      style={{ width: w, padding: '6px 10px', border: `1.5px solid ${C.sky}`,
        borderRadius: 8, fontSize: 13, fontFamily: 'Inter,sans-serif' }} />
  )

  const rows = [
    { label: '🧺 Room Welcome Baskets', qtyKey:'basketQty', qty:basketQty, priceKey:'basketPrice', price:basketPrice, total:basketTotal },
    { label: '🎁 Gift Hampers (per guest)', qtyKey:'hamperQty', qty:hamperQty, priceKey:'hamperPrice', price:hamperPrice, total:hamperTotal },
    { label: '📨 Stationery & Invitations', qtyKey:'stationQty', qty:stationQty, priceKey:'stationPP', price:stationPP, total:stationTotal },
  ]

  return (
    <div>
      {/* Room Basket Tier */}
      <div className="section-card">
        <div className="section-title">🧺 Room Basket Tier</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
            { id:'luxury',   emoji:'👑', label:'Luxury',   rate:'₹2,500/room' },
            { id:'standard', emoji:'🌸', label:'Standard', rate:'₹800/room' },
            { id:'minimal',  emoji:'🌿', label:'Minimal',  rate:'₹300/room' },
          ].map(opt => (
            <div key={opt.id} onClick={() => update('room_basket_budget', opt.id)}
              style={{ border:`2px solid ${wedding.room_basket_budget===opt.id ? C.amber : C.sky}`,
                borderRadius:14, padding:18, textAlign:'center', cursor:'pointer',
                background: wedding.room_basket_budget===opt.id ? '#fffbea' : 'white',
                transition:'all 0.2s' }}>
              <div style={{ fontSize:34 }}>{opt.emoji}</div>
              <div style={{ fontWeight:700, marginTop:6, fontSize:15, color:C.primary }}>{opt.label}</div>
              <div style={{ fontSize:12, color:C.blue, fontWeight:700, marginTop:2 }}>{opt.rate}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sundries Table */}
      <div className="section-card">
        <div className="section-title">📋 Sundries — Editable</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead>
              <tr style={{ background: C.light }}>
                {['Item','Qty','Unit Price (₹)','Total'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', textAlign: h==='Total'?'right':'left',
                    fontWeight:700, color:C.primary, borderBottom:`2px solid ${C.amber}`, fontSize:13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} style={{ background: i%2===0 ? 'white' : C.light }}>
                  <td style={{ padding:'12px 14px', fontWeight:600, color:C.primary }}>{r.label}</td>
                  <td style={{ padding:'12px 14px' }}>{inp(r.qty, r.qtyKey)}</td>
                  <td style={{ padding:'12px 14px' }}>{inp(r.price, r.priceKey, 100)}</td>
                  <td style={{ padding:'12px 14px', textAlign:'right', fontWeight:700, color:C.blue }}>{formatRupees(r.total)}</td>
                </tr>
              ))}
              {/* Ritual Materials */}
              <tr style={{ background:'white' }}>
                <td style={{ padding:'12px 14px', fontWeight:600, color:C.primary }}>🪔 Ritual Materials (puja samagri)</td>
                <td style={{ padding:'12px 14px', color:'#4a7a94', fontSize:12 }}>—</td>
                <td style={{ padding:'12px 14px' }}>
                  {inp(ritualAmt, 'ritualAmt', 110)}
                  <div style={{ fontSize:10, color:'#4a7a94', marginTop:2 }}>total ₹</div>
                </td>
                <td style={{ padding:'12px 14px', textAlign:'right', fontWeight:700, color:C.blue }}>{formatRupees(ritualAmt)}</td>
              </tr>
              {/* Photography */}
              <tr style={{ background: C.light }}>
                <td style={{ padding:'12px 14px', fontWeight:600, color:C.primary }}>📸 Photography & Videography</td>
                <td style={{ padding:'12px 14px', color:'#4a7a94', fontSize:12 }}>—</td>
                <td style={{ padding:'12px 14px' }}>
                  {inp(photoVideo, 'photoVideo', 110)}
                  <div style={{ fontSize:10, color:'#4a7a94', marginTop:2 }}>total ₹</div>
                </td>
                <td style={{ padding:'12px 14px', textAlign:'right', fontWeight:700, color:C.blue }}>{formatRupees(photoVideo)}</td>
              </tr>
              {/* Makeup */}
              <tr style={{ background:'white' }}>
                <td style={{ padding:'12px 14px', fontWeight:600, color:C.primary }}>💄 Bridal Makeup & Hair</td>
                <td style={{ padding:'12px 14px', color:'#4a7a94', fontSize:12 }}>—</td>
                <td style={{ padding:'12px 14px' }}>
                  {inp(makeupHair, 'makeupHair', 110)}
                  <div style={{ fontSize:10, color:'#4a7a94', marginTop:2 }}>total ₹</div>
                </td>
                <td style={{ padding:'12px 14px', textAlign:'right', fontWeight:700, color:C.blue }}>{formatRupees(makeupHair)}</td>
              </tr>
              <tr style={{ background: C.light }}>
                <td colSpan={3} style={{ padding:'12px 14px', fontWeight:700, color:C.primary }}>Sub-total</td>
                <td style={{ padding:'12px 14px', textAlign:'right', fontWeight:700, fontSize:15 }}>{formatRupees(subTotal)}</td>
              </tr>
              <tr style={{ background:'#fffbea' }}>
                <td style={{ padding:'12px 14px', fontWeight:600, color:'#7a5900' }}>⚡ Contingency (8%)</td>
                <td colSpan={2} style={{ padding:'12px 14px', fontSize:12, color:'#4a7a94' }}>Auto-calculated</td>
                <td style={{ padding:'12px 14px', textAlign:'right', fontWeight:700, color:C.orange }}>{formatRupees(contingency)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop:16, background:`linear-gradient(135deg,${C.primary},${C.blue})`,
          borderRadius:14, padding:'18px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:'white', fontSize:14, fontWeight:600 }}>Total Sundries</div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:12 }}>Including 8% contingency</div>
          </div>
          <div style={{ fontFamily:'EB Garamond,serif', fontSize:32, fontWeight:800, color:C.amber }}>
            {formatRupees(sundryTotal)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TAB 7: LOGISTICS ─────────────────────────────────────────────────────────
const VEHICLE_CONFIG = {
  'Innova':           { capacity: 7,  base_fare: 1500, per_km: 18, label: 'Innova Crysta (7 pax)' },
  'Tempo Traveller':  { capacity: 12, base_fare: 2000, per_km: 22, label: 'Tempo Traveller (12 pax)' },
  'Bus':              { capacity: 40, base_fare: 5000, per_km: 45, label: 'Mini Bus (40 pax)' },
}

const GHODI_RATES = {
  'Mumbai': 28000, 'Delhi': 25000, 'Chennai': 18000, 'Hyderabad': 18000,
  'Bengaluru': 22000, 'Kolkata': 15000, 'Jaipur': 20000, 'Pune': 20000,
  'Ahmedabad': 18000, 'Lucknow': 15000, 'Amritsar': 16000, 'Chandigarh': 18000,
}

const CITY_AVG_DISTANCE = {
  'Mumbai': 32, 'Delhi': 28, 'New Delhi': 28, 'Chennai': 20, 'Hyderabad': 25,
  'Bengaluru': 35, 'Kolkata': 18, 'Jaipur': 12, 'Pune': 15, 'Ahmedabad': 18,
  'Lucknow': 14, 'Amritsar': 12, 'Chandigarh': 15, 'Surat': 10,
}

const TRAVEL_MODES = ['Air', 'Train', 'Car', 'Other']

export function Tab7Logistics() {
  const { wedding, update } = useWedding()

  const outstationGuests = wedding.outstation_guests || 0
  const vehType = wedding.vehicle_type || 'Innova'
  const veh = VEHICLE_CONFIG[vehType]
  const sourceType = wedding.transfer_source_type || 'Airport'

  // Thumb rule: 1 vehicle per N guests (default 3, admin configurable)
  const guestsPerVehicle = wedding.guests_per_vehicle || 3

  // Distance: use manual override or city average
  const district = wedding.wedding_district || ''
  const autoDistance = CITY_AVG_DISTANCE[district] || 20
  const distance = wedding.transfer_distance_km > 0 ? wedding.transfer_distance_km : autoDistance

  // Fleet calculation: ceil(guests / thumb-rule ratio)
  const fleetSize = outstationGuests > 0 ? Math.ceil(outstationGuests / guestsPerVehicle) : 0
  // 2 trips: pickup + dropoff
  const costPerTrip = veh.base_fare + (distance * veh.per_km)
  const transferCost = fleetSize * 2 * costPerTrip

  // Bride / Groom travel cost — auto-calculated from mode + distance
  const calcTravel = (mode, distKm) => {
    if (!mode || !distKm) return 0
    if (mode === 'Car')   return Math.round(1500 + distKm * 18)
    if (mode === 'Train') return Math.round(500  + distKm * 2.5)
    if (mode === 'Air')   return Math.round(2000 + distKm * 5)
    return Math.round(distKm * 12)
  }
  const brideTravel = calcTravel(wedding.bride_travel_mode, wedding.bride_travel_distance_km)
  const groomTravel = calcTravel(wedding.groom_travel_mode, wedding.groom_travel_distance_km)

  // Ghodi
  const ghodiCost = wedding.ghodi ? (GHODI_RATES[district] || 15000) : 0

  // Dholi
  const dholiCost = (wedding.dholi_count || 0) * (wedding.dholi_hours || 2) * 4000

  // SFX
  const SFX_COSTS = { 'Cold Pyro': 18000, 'Confetti Cannon': 10000, 'Smoke Machine': 8000, 'Laser Show': 30000, 'Flower Cannon': 12000 }
  const sfxCost = (wedding.sfx_items || []).reduce((s, item) => s + (SFX_COSTS[item] || 0), 0)

  const logisticsTotal = transferCost + ghodiCost + dholiCost + sfxCost + brideTravel + groomTravel

  useEffect(() => {
    if (wedding.logistics_total !== logisticsTotal) update('logistics_total', logisticsTotal)
  }, [logisticsTotal])

  const mapsUrl = district
    ? `https://www.google.com/maps/dir/${encodeURIComponent(sourceType + ' ' + district)}/${encodeURIComponent((wedding.mandapam_name || 'Wedding Venue') + ' ' + district)}`
    : null

  return (
    <div>
      {/* Transfer Source */}
      <div className="section-card">
        <div className="section-title">🚐 Guest Transfer</div>
        <div style={{ fontSize: 13, color: '#4a7a94', marginBottom: 14 }}>
          Approximate estimates only — actual costs vary. Calculates cost for picking up outstation guests from transit hub to the wedding venue.
        </div>

        {/* Auto-distance calculator */}
        <div style={{ marginBottom: 16, padding: 14, background: C.light, borderRadius: 12, border: `1.5px dashed ${C.sky}` }}>
          <label className="form-label">Auto-calculate distance (free, no API key)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <input type="text" id="fromCity" placeholder="From city e.g. Chennai"
              style={{ flex: 1, minWidth: 140, padding: '8px 12px', border: `1.5px solid ${C.sky}`, borderRadius: 8, fontSize: 13, fontFamily: 'Inter,sans-serif' }} />
            <input type="text" id="toCity" placeholder="To city e.g. Coimbatore"
              style={{ flex: 1, minWidth: 140, padding: '8px 12px', border: `1.5px solid ${C.sky}`, borderRadius: 8, fontSize: 13, fontFamily: 'Inter,sans-serif' }} />
            <button id="fetchDistBtn" onClick={async (e) => {
              const btn = e.currentTarget
              const from = document.getElementById('fromCity').value.trim()
              const to   = document.getElementById('toCity').value.trim()
              if (!from || !to) { alert('Enter both cities'); return }
              btn.textContent = '...'
              try {
                const [oRes, dRes] = await Promise.all([
                  fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(from + ', India') + '&format=json&limit=1'),
                  fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(to + ', India') + '&format=json&limit=1')
                ])
                const [oData, dData] = await Promise.all([oRes.json(), dRes.json()])
                if (!oData[0] || !dData[0]) { alert('City not found. Try full name e.g. Chennai, Tamil Nadu'); btn.textContent = 'Get km'; return }
                const routeRes = await fetch('https://router.project-osrm.org/route/v1/driving/' + oData[0].lon + ',' + oData[0].lat + ';' + dData[0].lon + ',' + dData[0].lat + '?overview=false')
                const routeData = await routeRes.json()
                const km = Math.round(routeData.routes[0].distance / 1000)
                update('transfer_distance_km', km)
                btn.textContent = km + ' km ✓'
                setTimeout(() => { btn.textContent = 'Get km' }, 3000)
              } catch {
                alert('Auto-fetch failed. Enter km manually.')
                btn.textContent = 'Get km'
              }
            }} style={{ padding: '8px 16px', background: C.amber, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, color: C.primary, fontSize: 13 }}>
              Get km
            </button>
          </div>
        </div>

        {/* Source type */}
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Pickup Location</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
            {['Airport', 'Railway Station', 'Bus Stand'].map(type => (
              <button key={type} onClick={() => update('transfer_source_type', type)}
                style={{ padding: '8px 18px', borderRadius: 20, fontWeight: 700, fontSize: 13,
                  border: `2px solid ${wedding.transfer_source_type === type ? C.amber : C.sky}`,
                  background: wedding.transfer_source_type === type ? C.amber : 'white',
                  color: wedding.transfer_source_type === type ? C.primary : C.blue,
                  cursor: 'pointer', transition: 'all 0.2s' }}>
                {type === 'Airport' ? '✈️' : type === 'Railway Station' ? '🚆' : '🚌'} {type}
              </button>
            ))}
          </div>
        </div>

        {/* Thumb rule ratio */}
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Guests per Vehicle (Thumb Rule)</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button key={n} onClick={() => update('guests_per_vehicle', n)}
                style={{ padding: '7px 16px', borderRadius: 20, fontWeight: 700, fontSize: 13,
                  border: `2px solid ${guestsPerVehicle === n ? C.amber : C.sky}`,
                  background: guestsPerVehicle === n ? C.amber : 'white',
                  color: guestsPerVehicle === n ? C.primary : C.blue,
                  cursor: 'pointer', transition: 'all 0.2s' }}>
                1 car / {n} guests
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#4a7a94', marginTop: 4 }}>
            Default: 1 Innova Crysta per 3 guests (Indian family thumb rule). Admin can adjust.
          </div>
        </div>

        {/* Vehicle type */}
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Vehicle Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 6 }}>
            {Object.entries(VEHICLE_CONFIG).map(([id, cfg]) => (
              <div key={id} onClick={() => update('vehicle_type', id)}
                style={{ padding: '12px 14px', borderRadius: 12, textAlign: 'center', cursor: 'pointer',
                  border: `2px solid ${vehType === id ? C.amber : C.sky}`,
                  background: vehType === id ? '#fffbea' : 'white', transition: 'all 0.2s' }}>
                <div style={{ fontWeight: 700, color: C.primary, fontSize: 13 }}>{cfg.label}</div>
                <div style={{ fontSize: 11, color: C.blue, marginTop: 3 }}>
                  ₹{cfg.base_fare.toLocaleString()} base + ₹{cfg.per_km}/km
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distance input */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label className="form-label">
              Distance: {sourceType} → Venue (km)
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" className="form-input" min={1} max={200}
                value={wedding.transfer_distance_km || ''}
                placeholder={`Auto: ~${autoDistance} km`}
                onChange={e => update('transfer_distance_km', parseInt(e.target.value) || 0)}
                style={{ maxWidth: 150 }} />
              {wedding.transfer_distance_km === 0 && (
                <span style={{ fontSize: 12, color: C.blue, fontStyle: 'italic' }}>
                  Using city average ({autoDistance} km)
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', background: C.light, borderRadius: 10,
                  color: C.primary, fontWeight: 600, fontSize: 12, textDecoration: 'none',
                  border: `1.5px solid ${C.sky}` }}>
                🗺️ Measure on Google Maps
              </a>
            )}
          </div>
        </div>

        {outstationGuests > 0 ? (
          <div style={{ background: '#e8faf0', borderRadius: 12, padding: 16,
            border: '1.5px solid #6EE7B7' }}>
            <div style={{ fontWeight: 700, color: '#065F46', marginBottom: 10 }}>Transfer Calculation</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { label: 'Outstation Guests', value: `${outstationGuests}` },
                { label: `Vehicles (1 per ${guestsPerVehicle} guests)`, value: `${fleetSize}` },
                { label: 'Trips (pickup + drop)', value: `${fleetSize * 2}` },
                { label: 'Cost/Trip', value: formatRupees(costPerTrip) },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: 'white', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#4a7a94', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: 'EB Garamond,serif', fontSize: 20, fontWeight: 800, color: C.primary }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, textAlign: 'center', padding: '10px', background: 'white', borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: '#4a7a94' }}>Transfer Total: </span>
              <span style={{ fontFamily: 'EB Garamond,serif', fontSize: 22, fontWeight: 800, color: '#047857' }}>
                {formatRupees(transferCost)}
              </span>
              <span style={{ fontSize: 11, color: '#4a7a94', display: 'block', marginTop: 2 }}>
                {fleetSize} vehicles × 2 trips × ₹{Math.round(costPerTrip).toLocaleString()}/trip
              </span>
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px 16px', background: '#f0f4f8', borderRadius: 10, fontSize: 13, color: '#4a7a94' }}>
            No outstation guests entered. Add outstation guests in the Venue tab to calculate transfers.
          </div>
        )}
      </div>

      {/* Bride & Groom Travel */}
      <div className="section-card">
        <div className="section-title">💒 Bride & Groom Travel</div>
        <div style={{ fontSize: 13, color: '#4a7a94', marginBottom: 14 }}>
          If bride or groom is travelling from another city, include their travel cost here.
          Each ride is calculated per KM travelled.
        </div>
        {[
          { role: 'Bride', modeKey: 'bride_travel_mode', distKey: 'bride_travel_distance_km',
            travelCost: brideTravel,
            cityLabel: wedding.bride_district || wedding.bride_hometown || 'Bride\'s City' },
          { role: 'Groom', modeKey: 'groom_travel_mode', distKey: 'groom_travel_distance_km',
            travelCost: groomTravel,
            cityLabel: wedding.groom_district || wedding.groom_hometown || 'Groom\'s City' },
        ].map(({ role, modeKey, distKey, travelCost, cityLabel }) => {
          const mode = wedding[modeKey] || ''
          const distKm = wedding[distKey] || 0
          const mapsUrl = cityLabel && district
            ? `https://www.google.com/maps/dir/${encodeURIComponent(cityLabel)}/${encodeURIComponent((wedding.mandapam_name||'Wedding Venue')+' '+(district||''))}`
            : null
          return (
            <div key={role} style={{ padding: 14, background: C.light, borderRadius: 12, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.primary, marginBottom: 12 }}>
                {role === 'Bride' ? '👰' : '🤵'} {role}'s Travel
                <span style={{ fontSize: 12, color: '#4a7a94', fontWeight: 400, marginLeft: 8 }}>
                  From: {cityLabel}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.primary, display: 'block', marginBottom: 4 }}>
                    Travel Mode
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TRAVEL_MODES.map(m => (
                      <button key={m} onClick={() => update(modeKey, m)}
                        style={{ padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700,
                          border: `2px solid ${mode===m ? C.amber : C.sky}`,
                          background: mode===m ? C.amber : 'white',
                          color: mode===m ? C.primary : C.blue,
                          cursor: 'pointer' }}>
                        {m === 'Air' ? '✈️' : m === 'Train' ? '🚆' : m === 'Car' ? '🚗' : '🚌'} {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.primary, display: 'block', marginBottom: 4 }}>
                    Distance (km)
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="number" min={0}
                      value={wedding[distKey] || ''}
                      placeholder="Enter km"
                      onChange={e => update(distKey, parseInt(e.target.value) || 0)}
                      style={{ width: 90, padding: '6px 10px', border: `1.5px solid ${C.sky}`,
                        borderRadius: 8, fontSize: 13, fontFamily: 'Inter,sans-serif' }} />
                    {mapsUrl && (
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: C.blue, fontWeight: 600, textDecoration: 'none' }}>
                        🗺️ Maps
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.primary, display: 'block', marginBottom: 4 }}>
                    Estimated Cost
                  </label>
                  {travelCost > 0 ? (
                    <div style={{ padding: '8px 12px', background: '#e8faf0', borderRadius: 8,
                      border: '1.5px solid #6EE7B7', display: 'inline-block' }}>
                      <div style={{ fontFamily: 'EB Garamond,serif', fontSize: 20, fontWeight: 800, color: '#047857' }}>
                        {formatRupees(travelCost)}
                      </div>
                      <div style={{ fontSize: 10, color: '#4a7a94', marginTop: 2 }}>
                        Auto-calculated · {distKm} km by {mode}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', paddingTop: 8 }}>
                      Select mode & enter distance above
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Ghodi */}
      <div className="section-card">
        <div className="section-title">🐎 Baraat — Ghodi</div>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:8 }}>
          <div onClick={() => update('ghodi', !wedding.ghodi)}
            style={{ width:52, height:28, borderRadius:14, cursor:'pointer', transition:'all 0.2s',
              background: wedding.ghodi ? C.amber : C.sky, position:'relative' }}>
            <div style={{ position:'absolute', top:3, left: wedding.ghodi ? 26 : 3,
              width:22, height:22, borderRadius:'50%', background:'white',
              transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
          </div>
          <span style={{ fontWeight:600, fontSize:15, color:C.primary }}>
            {wedding.ghodi ? '✅ Ghodi booked' : 'Book a Ghodi for baraat'}
          </span>
          {wedding.ghodi && (
            <span style={{ color:C.blue, fontWeight:700, fontSize:15 }}>
              ≈ {formatRupees(ghodiCost)} <span style={{ fontSize:12, fontWeight:400 }}>({district || 'your city'})</span>
            </span>
          )}
        </div>
      </div>

      {/* Dholi */}
      <div className="section-card">
        <div className="section-title">🥁 Dholi</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <label className="form-label">Number of Dholis</label>
            <input type="number" className="form-input" min={0} max={20}
              value={wedding.dholi_count || 0}
              onChange={e => update('dholi_count', parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="form-label">Hours per Event</label>
            <input type="number" className="form-input" min={1} max={12}
              value={wedding.dholi_hours || 2}
              onChange={e => update('dholi_hours', parseInt(e.target.value) || 2)} />
          </div>
        </div>
        {(wedding.dholi_count || 0) > 0 && (
          <div style={{ marginTop:10, color:C.blue, fontWeight:700, fontSize:14 }}>
            Dholi cost: {formatRupees(dholiCost)}
            <span style={{ fontWeight:400, color:'#4a7a94', fontSize:12, marginLeft:8 }}>
              ({wedding.dholi_count} dholis × {wedding.dholi_hours}hr × ₹4,000/hr)
            </span>
          </div>
        )}
      </div>

      {/* SFX */}
      <div className="section-card">
        <div className="section-title">✨ Special Effects (SFX)</div>
        <MultiImageSelector items={SFX_ITEMS} selected={wedding.sfx_items || []}
          onChange={v => update('sfx_items', v)} showCost />
      </div>

      {/* Total */}
      <div className="section-card" style={{ border:`2px solid ${C.amber}` }}>
        <div className="section-title" style={{ color:C.primary }}>🚗 Total Logistics Cost</div>
        <div style={{ fontFamily:'EB Garamond,serif', fontSize:42, fontWeight:800,
          color:C.primary, textAlign:'center', marginBottom:20 }}>
          {formatRupees(logisticsTotal)}
        </div>

        <div style={{ background:C.light, borderRadius:12, padding:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.primary, marginBottom:10 }}>Cost Breakup:</div>
          {[
            { label:`${sourceType} Transfers`, calc: outstationGuests>0 ? `${fleetSize} ${vehType} × 2 trips × ₹${Math.round(costPerTrip).toLocaleString()} (1 per ${guestsPerVehicle} guests)` : 'No outstation guests', val:transferCost },
            { label:'Bride Travel', calc: wedding.bride_travel_mode ? `${wedding.bride_travel_mode} from ${wedding.bride_district||'bride city'}` : 'Not entered', val:brideTravel },
            { label:'Groom Travel', calc: wedding.groom_travel_mode ? `${wedding.groom_travel_mode} from ${wedding.groom_district||'groom city'}` : 'Not entered', val:groomTravel },
            { label:'Ghodi (Baraat)', calc: wedding.ghodi ? `Rate for ${district||'city'}` : 'Not booked', val:ghodiCost },
            { label:'Dholi', calc: (wedding.dholi_count||0)>0 ? `${wedding.dholi_count} × ${wedding.dholi_hours}hr × ₹4K` : 'Not added', val:dholiCost },
            { label:'Special Effects', calc: (wedding.sfx_items||[]).length>0 ? (wedding.sfx_items||[]).join(', ') : 'None selected', val:sfxCost },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'8px 0', borderBottom:`1px dashed rgba(33,158,188,0.3)`, fontSize:13 }}>
              <div>
                <div style={{ fontWeight:600, color:C.primary }}>{r.label}</div>
                <div style={{ fontSize:11, color:'#4a7a94' }}>{r.calc}</div>
              </div>
              <span style={{ fontWeight:700, color: r.val>0 ? C.blue : '#4a7a94' }}>
                {r.val > 0 ? formatRupees(r.val) : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
