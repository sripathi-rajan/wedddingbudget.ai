import { useState } from 'react'
import { motion } from 'framer-motion'

/**
 * StepQuestion — auto-advance selection component (Typeform-style)
 *
 * Props:
 *   question     {string}   — The question text
 *   subtitle     {string}   — Optional helper text below the question
 *   options      {Array}    — [{ id, label, icon?, description? }]
 *   value        {*}        — Currently selected id (or array if multi)
 *   onChange     {fn}       — Called with selected id on each click
 *   multi        {boolean}  — Allow multiple selections (default false)
 *   autoAdvance  {boolean}  — Auto-call onAdvance after selection (default true, ignored if multi)
 *   onAdvance    {fn}       — Called after advanceDelay ms to move to next step
 *   advanceDelay {number}   — ms before advancing (default 380)
 *   columns      {number}   — Grid column count (default 3)
 */
export default function StepQuestion({
  question,
  subtitle,
  options = [],
  value,
  onChange,
  multi = false,
  autoAdvance = true,
  onAdvance,
  advanceDelay = 380,
  columns = 3
}) {
  const [justSelected, setJustSelected] = useState(null)

  const isSelected = (id) => {
    if (multi) return Array.isArray(value) && value.includes(id)
    return value === id
  }

  const handleSelect = (id) => {
    onChange(id)
    if (!multi && autoAdvance && onAdvance) {
      setJustSelected(id)
      setTimeout(() => {
        setJustSelected(null)
        onAdvance()
      }, advanceDelay)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 0' }}>
      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ marginBottom: 28 }}
      >
        <h2 style={{
          fontSize: 'clamp(19px, 3vw, 26px)',
          fontWeight: 700, color: '#111',
          letterSpacing: '-0.4px', marginBottom: 6,
          fontFamily: "'DM Sans', 'Inter', sans-serif"
        }}>
          {question}
        </h2>
        {subtitle && (
          <p style={{
            fontSize: 14, color: '#777', lineHeight: 1.55,
            fontFamily: "'DM Sans', 'Inter', sans-serif"
          }}>
            {subtitle}
          </p>
        )}
      </motion.div>

      {/* Options grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 10
      }}>
        {options.map((opt, i) => {
          const selected = isSelected(opt.id)
          const pulsing = justSelected === opt.id

          return (
            <motion.button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1, y: 0,
                scale: pulsing ? 1.04 : 1
              }}
              transition={{
                opacity: { delay: i * 0.04, duration: 0.3 },
                y: { delay: i * 0.04, duration: 0.3 },
                scale: { duration: 0.18 }
              }}
              whileHover={{ scale: selected ? 1.02 : 1.025 }}
              style={{
                position: 'relative',
                padding: opt.icon ? '18px 12px' : '13px 14px',
                borderRadius: 10,
                border: selected ? '2px solid #D4537E' : '1px solid #EBEBEB',
                background: selected ? '#FBE8EF' : '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'center',
                outline: 'none',
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                transition: 'background 0.15s, border-color 0.15s',
                boxShadow: selected ? '0 0 0 3px rgba(212,83,126,0.1)' : 'none'
              }}
            >
              {/* Icon */}
              {opt.icon && (
                <div style={{ fontSize: 26, marginBottom: 8, lineHeight: 1 }}>
                  {opt.icon}
                </div>
              )}

              {/* Label */}
              <div style={{
                fontWeight: 700,
                fontSize: opt.icon ? 12 : 14,
                color: selected ? '#D4537E' : '#111',
                lineHeight: 1.3,
                marginBottom: opt.description ? 4 : 0
              }}>
                {opt.label}
              </div>

              {/* Description */}
              {opt.description && (
                <div style={{
                  fontSize: 11, color: '#999',
                  lineHeight: 1.4, marginTop: 2
                }}>
                  {opt.description}
                </div>
              )}

              {/* Check badge */}
              {selected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  style={{
                    position: 'absolute', top: 7, right: 7,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#D4537E', color: 'white',
                    fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Multi-select hint */}
      {multi && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: 12, color: '#bbb',
            marginTop: 14, textAlign: 'center',
            fontFamily: "'DM Sans', 'Inter', sans-serif"
          }}
        >
          Select all that apply
        </motion.p>
      )}
    </div>
  )
}
