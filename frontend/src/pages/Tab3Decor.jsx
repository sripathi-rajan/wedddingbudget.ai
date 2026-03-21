import { useState } from 'react'
import { useWedding, formatRupees } from '../context/WeddingContext'

const API = 'http://localhost:8000/api'

const DECOR_LIBRARY = [
  { id:1,  imageUrl:'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80', emoji:'🌸', name:'Floral Arch Mandap',       style:'Romantic',    complexity:'High',   base_cost:200000, function_type:'Mandap' },
  { id:2,  imageUrl:'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=400&q=80', emoji:'🕯️', name:'Candle Centerpieces',       style:'Minimalist',  complexity:'Low',    base_cost:40000,  function_type:'Table Decor' },
  { id:3,  imageUrl:'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&q=80', emoji:'🌺', name:'Marigold Garland Entrance', style:'Traditional', complexity:'Medium', base_cost:50000,  function_type:'Entrance' },
  { id:4,  imageUrl:'https://images.unsplash.com/photo-1501283070011-f6bc0016cd30?w=400&q=80', emoji:'✨', name:'LED Fairy Light Ceiling',   style:'Modern',      complexity:'High',   base_cost:130000, function_type:'Ceiling' },
  { id:5,  imageUrl:'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80', emoji:'🌿', name:'Tropical Leaf Backdrop',    style:'Boho',        complexity:'Medium', base_cost:70000,  function_type:'Backdrop' },
  { id:6,  imageUrl:'https://images.unsplash.com/photo-1561912774-79769a0a0a7a?w=400&q=80', emoji:'🦋', name:'Floral Stage Decor',        style:'Whimsical',   complexity:'High',   base_cost:250000, function_type:'Stage' },
  { id:7,  imageUrl:'https://images.unsplash.com/photo-1563170351-be4f2d5f5781?w=400&q=80', emoji:'🪔', name:'Diya Pathway Lighting',     style:'Traditional', complexity:'Low',    base_cost:25000,  function_type:'Lighting' },
  { id:8,  imageUrl:'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&q=80', emoji:'🌙', name:'Moon Gate Photo Booth',     style:'Modern',      complexity:'Medium', base_cost:60000,  function_type:'Photo Booth' },
  { id:9,  imageUrl:'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80', emoji:'🌹', name:'Rose Petal Aisle',          style:'Romantic',    complexity:'Low',    base_cost:20000,  function_type:'Aisle' },
  { id:10, imageUrl:'https://images.unsplash.com/photo-1566737236500-c8ac43014a8e?w=400&q=80', emoji:'🏛️', name:'Royal Pillar Draping',      style:'Luxury',      complexity:'High',   base_cost:300000, function_type:'Pillars' },
  { id:11, imageUrl:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80', emoji:'🌼', name:'Rustic Farm Table',         style:'Rustic',      complexity:'Medium', base_cost:52000,  function_type:'Table Decor' },
  { id:12, imageUrl:'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80', emoji:'🎊', name:'Confetti & Balloon Arch',   style:'Playful',     complexity:'Low',    base_cost:32000,  function_type:'Ceiling' },
  { id:13, imageUrl:'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80', emoji:'👑', name:'Palace Chandelier Setup',   style:'Luxury',      complexity:'High',   base_cost:450000, function_type:'Ceiling' },
  { id:14, imageUrl:'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80', emoji:'🌙', name:'Mehendi Decor Setup',       style:'Traditional', complexity:'Medium', base_cost:85000,  function_type:'Backdrop' },
  { id:15, imageUrl:'https://images.unsplash.com/photo-1595407753234-0882f1e77954?w=400&q=80', emoji:'💛', name:'Haldi Theme Decor',         style:'Playful',     complexity:'Low',    base_cost:35000,  function_type:'Entrance' },
  { id:16, imageUrl:'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80', emoji:'🎵', name:'Sangeet Stage Lights',      style:'Modern',      complexity:'High',   base_cost:180000, function_type:'Stage' },
]

const COMPLEXITY_COLOR = { Low:'#059669', Medium:'#D97706', High:'#fb8500' }
const STYLE_COLOR = {
  Romantic:'#fb8500', Minimalist:'#475569', Traditional:'#C2410C', Modern:'#1D4ED8',
  Boho:'#65A30D', Whimsical:'#219ebc', Luxury:'#B45309', Rustic:'#78350F', Playful:'#0369A1'
}

function localPredict(item) {
  const mult = { Low:0.85, Medium:1.0, High:1.3 }[item.complexity] || 1
  const p = Math.round(item.base_cost * mult)
  return { predicted: p, low: Math.round(p*0.8), high: Math.round(p*1.2) }
}

function DecorCard({ item, isSel, onToggle }) {
  const [imgErr, setImgErr] = useState(false)
  const p = localPredict(item)
  return (
    <div onClick={() => onToggle(item)} style={{
      border:`2px solid ${isSel?'var(--primary)':'var(--border)'}`,
      borderRadius:16, overflow:'hidden', cursor:'pointer',
      background: isSel ? 'var(--primary-light)' : 'white',
      boxShadow: isSel ? '0 4px 20px rgba(255,183,3,0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
      transform: isSel ? 'translateY(-2px)' : 'none',
      transition:'all 0.22s', position:'relative'
    }}>
      {item.imageUrl && !imgErr ? (
        <img src={item.imageUrl} alt={item.name}
          onError={() => setImgErr(true)}
          style={{ width:'100%', height:140, objectFit:'cover', display:'block' }} />
      ) : (
        <div style={{ fontSize:52, textAlign:'center', padding:'24px 0 14px',
          background:'linear-gradient(160deg,var(--ivory-dark),var(--primary-light))' }}>{item.emoji}</div>
      )}
      <div style={{ padding:'12px 14px 14px' }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:8, lineHeight:1.3 }}>{item.name}</div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
          <span style={{ fontSize:10, padding:'3px 9px', borderRadius:10, fontWeight:700,
            background:COMPLEXITY_COLOR[item.complexity]+'20', color:COMPLEXITY_COLOR[item.complexity] }}>
            {item.complexity}
          </span>
          <span style={{ fontSize:10, padding:'3px 9px', borderRadius:10, fontWeight:700,
            background:(STYLE_COLOR[item.style]||'#888')+'20', color:STYLE_COLOR[item.style]||'#888' }}>
            {item.style}
          </span>
        </div>
        <div style={{ fontFamily:'EB Garamond,serif', fontSize:19, fontWeight:700, color:'var(--primary)' }}>
          {formatRupees(p.predicted)}
        </div>
        <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
          {formatRupees(p.low)} – {formatRupees(p.high)}
        </div>
      </div>
      {isSel && (
        <div style={{ position:'absolute', top:10, right:10, width:28, height:28,
          background:'var(--primary)', borderRadius:'50%', display:'flex',
          alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold', fontSize:14,
          boxShadow:'0 2px 8px rgba(255,183,3,0.5)' }}>✓</div>
      )}
    </div>
  )
}

export default function Tab3Decor() {
  const { wedding, update } = useWedding()
  const [selected, setSelected] = useState([])
  const [filter, setFilter] = useState('')
  const [uploadTag, setUploadTag] = useState({ function_type:'Mandap', style:'Romantic', complexity:'Medium' })
  const [uploadedFile, setUploadedFile] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [predicting, setPredicting] = useState(false)
  const [predStep, setPredStep] = useState('')
  const [imgRelevanceWarn, setImgRelevanceWarn] = useState('')

  const toggleItem = (item) => {
    const exists = selected.find(s => s.id === item.id)
    let next
    if (exists) next = selected.filter(s => s.id !== item.id)
    else { const p = localPredict(item); next = [...selected, { ...item, ...p }] }
    setSelected(next)
    update('decor_total', next.reduce((s,i) => s + i.predicted, 0))
    update('selected_decor', next.map(s => s.name))
  }

  const handlePredict = async () => {
    if (!uploadedFile) return
    setImgRelevanceWarn('')
    setPredicting(true)
    setPrediction(null)

    const formData = new FormData()
    formData.append('file', uploadedFile)
    formData.append('function_type', uploadTag.function_type)
    formData.append('complexity', uploadTag.complexity)
    formData.append('style', uploadTag.style)

    try {
      setPredStep('Extracting image embeddings via MobileNetV2...')
      const res = await fetch('http://localhost:5001/predict', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      setPrediction({
        predicted_cost:    d.predicted_cost,
        range:             [d.cost_low, d.cost_high],
        confidence:        d.confidence,
        similar_items:     (d.similar_items || []).map(s => ({
          name:          s.function_type,
          function_type: s.function_type,
          base_cost:     s.base_cost,
          similarity_pct: s.similarity_pct
        })),
        source: `ML Model · ${d.n_training_samples} samples · MAE ₹${Number(d.mae).toLocaleString('en-IN')}`
      })
    } catch (err) {
      // Offline fallback
      const base = {
        Mandap:200000, Entrance:55000, 'Table Decor':45000, Ceiling:90000,
        Backdrop:70000, Stage:250000, Lighting:30000, 'Photo Booth':60000,
        Aisle:22000, Pillars:300000
      }
      const b = base[uploadTag.function_type] || 70000
      const mult = {Low:0.75, Medium:1.0, High:1.40}[uploadTag.complexity] || 1
      const sm = {Luxury:1.45, Whimsical:1.25, Romantic:1.15, Modern:1.05, Rustic:0.88, Minimalist:0.72, Traditional:0.95, Boho:0.90, Playful:0.80}[uploadTag.style] || 1
      const pred = Math.round(b * mult * sm * (0.92 + Math.random()*0.16))
      setImgRelevanceWarn(`⚠️ Could not reach ML server (${err.message}). Showing offline estimate.`)
      setPrediction({
        predicted_cost: pred,
        range: [Math.round(pred*0.8), Math.round(pred*1.25)],
        confidence: 0.80 + Math.random()*0.14,
        similar_items: DECOR_LIBRARY.filter(d => d.style === uploadTag.style || d.complexity === uploadTag.complexity).slice(0,3),
        source: 'Offline estimate (ML server not running)'
      })
    }
    setPredicting(false)
    setPredStep('')
  }

  const filtered = filter ? DECOR_LIBRARY.filter(d => d.style===filter || d.complexity===filter) : DECOR_LIBRARY
  const totalDecor = selected.reduce((s,i) => s + i.predicted, 0)

  return (
    <div>
      {/* Gallery */}
      <div className="section-card">
        <div className="section-title">🖼️ Decor Gallery</div>

        {/* Filter pills */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
          {['','Romantic','Traditional','Modern','Luxury','Minimalist','Boho','Low','Medium','High'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer',
              fontSize:12, fontWeight:700, transition:'all 0.2s',
              background: filter===f ? 'var(--primary)' : 'var(--primary-light)',
              color: filter===f ? 'white' : 'var(--primary-dark)',
              boxShadow: filter===f ? '0 3px 10px rgba(255,183,3,0.35)' : 'none'
            }}>{f||'All'}</button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))', gap:16 }}>
          {filtered.map(item => (
            <DecorCard
              key={item.id}
              item={item}
              isSel={!!selected.find(s=>s.id===item.id)}
              onToggle={toggleItem}
            />
          ))}
        </div>
      </div>

      {/* Selected Summary */}
      {selected.length > 0 && (
        <div className="section-card" style={{ border:'1.5px solid var(--primary)' }}>
          <div className="section-title">✅ Your Shortlist ({selected.length} items)</div>
          <div style={{ marginBottom:16 }}>
            {selected.map(s => (
              <div key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <span style={{ fontSize:26 }}>{s.emoji}</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{s.name}</div>
                    <div style={{ display:'flex', gap:6, marginTop:4 }}>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, fontWeight:700,
                        background:COMPLEXITY_COLOR[s.complexity]+'20', color:COMPLEXITY_COLOR[s.complexity] }}>{s.complexity}</span>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, fontWeight:700,
                        background:(STYLE_COLOR[s.style]||'#888')+'20', color:STYLE_COLOR[s.style]||'#888' }}>{s.style}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div>
                    <div style={{ fontFamily:'EB Garamond,serif', fontSize:19, fontWeight:700, color:'var(--primary)', textAlign:'right' }}>
                      {formatRupees(s.predicted)}
                    </div>
                    <div style={{ fontSize:11, color:'var(--muted)', textAlign:'right' }}>
                      {formatRupees(s.low)} – {formatRupees(s.high)}
                    </div>
                  </div>
                  <button onClick={(e)=>{e.stopPropagation();toggleItem(s)}} style={{
                    width:28, height:28, borderRadius:'50%', border:'none', background:'#FEE2E2',
                    color:'#DC2626', cursor:'pointer', fontWeight:'bold', fontSize:16
                  }}>×</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:'linear-gradient(135deg,#023047,#04699b)', borderRadius:14,
            padding:'18px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ color:'white', fontSize:15, fontWeight:600 }}>Total Decor Budget</div>
            <div style={{ fontFamily:'EB Garamond,serif', fontSize:30, fontWeight:800, color:'#FDE68A' }}>
              {formatRupees(totalDecor)}
            </div>
          </div>
        </div>
      )}

      {/* AI Predictor */}
      <div className="section-card" style={{ border:'2px solid var(--secondary)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,var(--secondary),#7a5900)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🤖</div>
          <div className="section-title" style={{ color:'#7a5900', marginBottom:0 }}>AI Cost Predictor</div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, margin:'0 0 20px' }}>
          {[
            { key:'function_type', label:'Function Type',
              opts:['Mandap','Entrance','Table Decor','Ceiling','Backdrop','Stage','Lighting','Photo Booth','Aisle','Pillars'] },
            { key:'style', label:'Style',
              opts:['Romantic','Traditional','Modern','Luxury','Minimalist','Boho','Whimsical','Rustic','Playful'] },
            { key:'complexity', label:'Complexity', opts:['Low','Medium','High'] }
          ].map(({key,label,opts})=>(
            <div key={key}>
              <label className="form-label">{label}</label>
              <select className="form-select" value={uploadTag[key]}
                onChange={e=>setUploadTag(p=>({...p,[key]:e.target.value}))}>
                {opts.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Drop Zone */}
        <div style={{ border:`2px dashed ${uploadedFile ? '#059669' : 'var(--secondary)'}`, borderRadius:14, padding:'28px 20px',
          textAlign:'center', background: uploadedFile ? '#f0fdf4' : 'var(--secondary-light)', marginBottom:18, cursor:'pointer',
          transition:'all 0.2s' }}
          onClick={()=>document.getElementById('decor-upload').click()}>
          <div style={{ fontSize:44 }}>{uploadedFile ? '✅' : '📸'}</div>
          <div style={{ fontWeight:700, color: uploadedFile ? '#047857' : '#7a5900', marginTop:6 }}>
            {uploadedFile ? uploadedFile.name : 'Drop your decor image here'}
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>
            {uploadedFile ? 'Click to change image' : 'PNG, JPG — AI extracts features and predicts cost'}
          </div>
          <input id="decor-upload" type="file" accept="image/*" style={{ display:'none' }}
            onChange={e => {
              if (e.target.files?.[0]) {
                setUploadedFile(e.target.files[0])
                setPrediction(null)
                setImgRelevanceWarn('')
              }
            }} />
        </div>

        {imgRelevanceWarn && (
          <div style={{ marginBottom:14, padding:'12px 16px', background:'#FEF2F2', borderRadius:10,
            border:'1.5px solid #FCA5A5', fontSize:13, color:'#DC2626', fontWeight:600 }}>
            {imgRelevanceWarn}
          </div>
        )}

        <button onClick={handlePredict} disabled={predicting || !uploadedFile} style={{
          width:'100%', padding:'14px', borderRadius:12, border:'none',
          cursor: predicting || !uploadedFile ? 'not-allowed' : 'pointer',
          background: !uploadedFile ? '#D1D5DB' : predicting ? '#F9A8D4' : 'linear-gradient(135deg,var(--secondary),#7a5900)',
          color: !uploadedFile ? '#9CA3AF' : 'white', fontWeight:700, fontSize:15, transition:'all 0.2s'
        }}>
          {predicting ? '🤖 AI Processing...' : !uploadedFile ? '📸 Upload an image to predict' : '✨ Predict Cost with AI'}
        </button>

        {predicting && predStep && (
          <div style={{ marginTop:14, padding:'12px 16px', background:'var(--secondary-light)', borderRadius:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:16, height:16, borderRadius:'50%', border:'2.5px solid var(--secondary)',
                borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
              <span style={{ fontSize:13, color:'#7a5900', fontWeight:600 }}>{predStep}</span>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {prediction && !predicting && (
          <div style={{ marginTop:18, padding:22, background:'linear-gradient(135deg,var(--secondary-light),#FDF2F8)',
            borderRadius:16, border:'1.5px solid #F9A8D4' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <div style={{ fontFamily:'EB Garamond,serif', fontSize:14, color:'#7a5900', marginBottom:4 }}>
                  AI Predicted Cost
                </div>
                <div style={{ fontFamily:'EB Garamond,serif', fontSize:38, fontWeight:800, color:'var(--secondary)', lineHeight:1 }}>
                  {formatRupees(prediction.predicted_cost)}
                </div>
                <div style={{ fontSize:13, color:'var(--muted)', marginTop:6 }}>
                  Range: {formatRupees(prediction.range?.[0])} – {formatRupees(prediction.range?.[1])}
                </div>
              </div>
              <div style={{ textAlign:'center', background:'white', borderRadius:14, padding:'14px 20px',
                border:'1px solid #F9A8D4' }}>
                <div style={{ fontSize:26, fontWeight:800, color: prediction.confidence > 0.8 ? '#059669' : '#D97706' }}>
                  {Math.round((prediction.confidence||0.80)*100)}%
                </div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Confidence</div>
              </div>
            </div>

            <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px',
              background:'rgba(236,72,153,0.1)', borderRadius:20, marginBottom:16 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#7a5900' }}>🔬 {prediction.source}</span>
            </div>

            {prediction.similar_items?.length > 0 && (
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:'#7a5900', marginBottom:10 }}>
                  🔍 Similar designs from our library:
                </div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  {prediction.similar_items.slice(0,3).map((s,i)=>{
                    const libItem = DECOR_LIBRARY.find(d=>d.name===s.name || d.function_type===s.function_type)
                    return (
                      <div key={i} style={{ padding:'8px 14px', background:'white', borderRadius:10,
                        border:'1px solid #F9A8D4', fontSize:13, display:'flex', gap:6, alignItems:'center' }}>
                        <span style={{ fontSize:18 }}>{libItem?.emoji||'🎨'}</span>
                        <div>
                          <div style={{ fontWeight:600 }}>{s.name||s.function_type}</div>
                          <div style={{ fontSize:11, color:'var(--primary)', fontWeight:700 }}>
                            {formatRupees(s.actual_cost||s.base_cost)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
