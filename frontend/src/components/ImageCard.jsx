import { useState } from 'react'

export function ImageCard({ item, selected, onClick, showCost = false }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className={`image-card ${selected ? 'selected' : ''}`}
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
        <div className="card-emoji">{item.emoji || '•'}</div>
      )}
      <div className="card-label">{item.label}</div>
      {showCost && item.cost && (
        <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, textAlign: 'center', paddingBottom: 6 }}>
          {item.cost}
        </div>
      )}
      {showCost && item.desc && !item.cost && (
        <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, textAlign: 'center', paddingBottom: 6 }}>
          {item.desc}
        </div>
      )}
      <span className="check-badge">✓</span>
    </div>
  )
}

export function MultiImageSelector({ items, selected = [], onChange, showCost = false }) {
  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id))
    else onChange([...selected, id])
  }
  return (
    <div className="image-grid">
      {items.map(item => (
        <ImageCard key={item.id} item={item} selected={selected.includes(item.id)}
          onClick={toggle} showCost={showCost} />
      ))}
    </div>
  )
}

export function SingleImageSelector({ items, selected, onChange, showCost = false }) {
  return (
    <div className="image-grid">
      {items.map(item => (
        <ImageCard key={item.id} item={item} selected={selected === item.id}
          onClick={(id) => onChange(id === selected ? '' : id)} showCost={showCost} />
      ))}
    </div>
  )
}
