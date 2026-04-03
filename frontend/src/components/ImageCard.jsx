import { useState } from 'react'

export function ImageCard({ item, selected, onClick, showCost = false, hasAnySelected = false }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className={`image-card sel-card ${selected ? 'selected' : ''} ${hasAnySelected && !selected ? 'dimmed' : ''}`}
      onClick={() => onClick(item.id)}
      title={item.label}
    >
      {item.imageUrl && !imgError ? (
        <img
          src={item.imageUrl}
          alt={item.label}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="card-emoji sel-card-icon">{item.emoji || '•'}</div>
      )}
      <div className="card-label" style={{ overflow: 'hidden', maxWidth: '100%' }}>{item.label}</div>
      {showCost && item.cost && (
        <div style={{ fontSize: 11, color: selected ? '#B83A64' : 'var(--primary)', fontWeight: 700, textAlign: 'center', paddingBottom: 6 }}>
          {item.cost}
        </div>
      )}
      {showCost && item.desc && !item.cost && (
        <div style={{ fontSize: 11, color: selected ? '#B83A64' : 'var(--primary)', fontWeight: 600, textAlign: 'center', paddingBottom: 6 }}>
          {item.desc}
        </div>
      )}
      {/* Rose checkmark badge — springs in via CSS when .selected */}
      <span
        className="check-badge-rose"
        style={{
          position: 'absolute', top: 7, right: 7,
          width: 22, height: 22, borderRadius: '50%',
          background: '#D4537E', color: 'white',
          fontSize: 12, fontWeight: 800,
          alignItems: 'center', justifyContent: 'center',
          display: selected ? 'flex' : 'none',
          boxShadow: '0 2px 8px rgba(212,83,126,0.4)',
          animation: selected ? 'checkSpring 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none'
        }}
      >✓</span>
    </div>
  )
}

export function MultiImageSelector({ items, selected = [], onChange, showCost = false }) {
  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id))
    else onChange([...selected, id])
  }
  const hasAny = selected.length > 0
  return (
    <div className="image-grid">
      {items.map(item => (
        <ImageCard
          key={item.id} item={item}
          selected={selected.includes(item.id)}
          hasAnySelected={hasAny && !selected.includes(item.id)}
          onClick={toggle} showCost={showCost}
        />
      ))}
    </div>
  )
}

export function SingleImageSelector({ items, selected, onChange, showCost = false }) {
  const hasAny = !!selected
  return (
    <div className="image-grid">
      {items.map(item => (
        <ImageCard
          key={item.id} item={item}
          selected={selected === item.id}
          hasAnySelected={hasAny && selected !== item.id}
          onClick={(id) => onChange(id === selected ? '' : id)}
          showCost={showCost}
        />
      ))}
    </div>
  )
}
