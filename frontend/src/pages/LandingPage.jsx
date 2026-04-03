import { useState } from 'react'
import { motion } from 'framer-motion'

const FEATURES = [
  {
    icon: '🔮',
    title: 'AI Decor Prediction',
    description: 'Upload décor inspiration photos and get instant cost estimates powered by machine learning.'
  },
  {
    icon: '📊',
    title: 'Complete Budget Breakdown',
    description: 'Every category — venue, food, artists, logistics — accounted for with ₹-accurate estimates.'
  },
  {
    icon: '🕌',
    title: 'All Indian Wedding Types',
    description: 'Hindu, Muslim, Sikh, Christian, Buddhist, Jain, and more. Regional pricing built in.'
  }
]

const STEPS = [
  { num: '01', title: 'Tell us about your wedding', desc: 'Wedding type, date, guest count, location, and budget tier.' },
  { num: '02', title: 'Customize every detail', desc: 'Venue, food, décor, artists, logistics — pick exactly what you want.' },
  { num: '03', title: 'Get your full budget', desc: 'Instant breakdown with AI-confidence scoring and full category view.' }
]

const STATS = [
  { value: '7', label: 'Wedding Types' },
  { value: '₹5L–5Cr', label: 'Budget Range' },
  { value: '8', label: 'Planning Steps' },
  { value: '100%', label: 'Free Forever' },
]

const S = {
  page: {
    minHeight: '100vh',
    background: '#FFFFFF',
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    color: '#111',
    overflowX: 'hidden'
  },
  nav: {
    display: 'flex', alignItems: 'center',
    padding: '0 48px', height: 64,
    borderBottom: '1px solid #EBEBEB',
    position: 'sticky', top: 0,
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(12px)',
    zIndex: 100
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 9, flex: 1
  },
  logoText: {
    fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', color: '#111'
  },
  adminBtn: {
    background: 'none', border: '1px solid #EBEBEB',
    borderRadius: 8, padding: '7px 16px',
    fontSize: 13, fontWeight: 600, color: '#666', cursor: 'pointer',
    transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif"
  },
  hero: {
    maxWidth: 840, margin: '0 auto',
    padding: 'clamp(48px, 8vw, 96px) 32px 64px',
    textAlign: 'center'
  },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '5px 14px', borderRadius: 20,
    background: '#FBE8EF', color: '#D4537E',
    fontSize: 12, fontWeight: 700, letterSpacing: '0.4px',
    marginBottom: 28, border: '1px solid #F2C4D4'
  },
  h1: {
    fontSize: 'clamp(36px, 6vw, 66px)',
    fontWeight: 700, lineHeight: 1.1,
    letterSpacing: '-1.5px', marginBottom: 22, color: '#111'
  },
  heroSub: {
    fontSize: 17, color: '#555',
    maxWidth: 520, margin: '0 auto 40px',
    lineHeight: 1.65, fontWeight: 400
  },
  ctaPrimary: {
    padding: '15px 38px', borderRadius: 10,
    background: '#D4537E', color: 'white',
    fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
    letterSpacing: '-0.2px', transition: 'all 0.2s',
    boxShadow: '0 4px 20px rgba(212,83,126,0.3)',
    fontFamily: "'DM Sans', sans-serif"
  },
  ctaSecondary: {
    padding: '14px 28px', borderRadius: 10,
    background: 'none', color: '#666',
    fontSize: 14, fontWeight: 600,
    border: '1px solid #EBEBEB', cursor: 'pointer',
    transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif"
  },
  trustLine: {
    fontSize: 12, color: '#aaa', marginTop: 18, letterSpacing: '0.2px'
  },
  divider: {
    height: 1, background: '#EBEBEB',
    maxWidth: 800, margin: '0 auto'
  },
  section: {
    maxWidth: 960, margin: '0 auto', padding: '72px 32px'
  },
  sectionHeading: {
    textAlign: 'center', fontSize: 'clamp(22px, 3vw, 30px)',
    fontWeight: 700, marginBottom: 10, letterSpacing: '-0.5px'
  },
  sectionSub: {
    textAlign: 'center', color: '#666',
    marginBottom: 52, fontSize: 15
  },
  featureCard: {
    padding: '28px 24px',
    border: '1px solid #EBEBEB',
    borderRadius: 14, background: '#ffffff'
  },
  featureIcon: { fontSize: 30, marginBottom: 14 },
  featureTitle: { fontWeight: 700, fontSize: 15, marginBottom: 8, letterSpacing: '-0.2px' },
  featureDesc: { fontSize: 14, color: '#666', lineHeight: 1.65 },
  stepNum: {
    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
    background: '#FBE8EF', color: '#D4537E',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 13
  },
  stepTitle: { fontWeight: 700, fontSize: 15, marginBottom: 5 },
  stepDesc: { fontSize: 13, color: '#666', lineHeight: 1.6 },
  statValue: { fontSize: 34, fontWeight: 800, color: '#111', letterSpacing: '-1px' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 4, fontWeight: 500, letterSpacing: '0.2px' },
  footer: {
    borderTop: '1px solid #EBEBEB',
    padding: '24px 48px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
  }
}

export default function LandingPage({ onEnter }) {
  const [fading, setFading] = useState(false)

  const enter = (role) => {
    if (role === 'admin') {
      const pwd = prompt('Enter admin password:')
      if (pwd !== 'wedding@admin2025') { alert('Incorrect password'); return }
    }
    setFading(true)
    setTimeout(() => onEnter(role), 450)
  }

  return (
    <motion.div
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 0.45 }}
      style={S.page}
    >
      {/* ── Nav ── */}
      <nav style={S.nav}>
        <div style={S.logo}>
          <span style={{ fontSize: 20 }}>💍</span>
          <span style={S.logoText}>WeddingBudget.AI</span>
        </div>
        <button
          style={S.adminBtn}
          onClick={() => enter('admin')}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4537E'; e.currentTarget.style.color = '#D4537E' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.color = '#666' }}
        >
          Admin
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={S.hero}>
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div style={S.eyebrow}>✦ AI-Powered Wedding Planning</div>
        </motion.div>

        <motion.h1
          style={S.h1}
          initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          Your dream wedding,<br />
          <span style={{ color: '#D4537E' }}>brilliantly planned.</span>
        </motion.h1>

        <motion.p
          style={S.heroSub}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
        >
          Instant budget estimates for Hindu, Muslim, Christian &amp; all Indian weddings.
          AI-powered, completely free, and surprisingly accurate.
        </motion.p>

        <motion.div
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.24 }}
        >
          <button
            style={S.ctaPrimary}
            onClick={() => enter('client')}
            onMouseEnter={e => { e.currentTarget.style.background = '#B83A64'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#D4537E'; e.currentTarget.style.transform = 'none' }}
          >
            Start Planning — It's Free →
          </button>
        </motion.div>

        <motion.p
          style={S.trustLine}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          No signup required · 8 planning steps · 100+ cost items
        </motion.p>
      </section>

      <div style={S.divider} />

      {/* ── Features ── */}
      <section style={S.section}>
        <motion.h2
          style={S.sectionHeading}
          initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.4 }}
        >
          Everything you need to plan
        </motion.h2>
        <motion.p
          style={S.sectionSub}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ delay: 0.08 }}
        >
          From first idea to final invoice — one tool, end to end.
        </motion.p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              style={S.featureCard}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(0,0,0,0.07)', borderColor: '#D4537E20' }}
            >
              <div style={S.featureIcon}>{f.icon}</div>
              <div style={S.featureTitle}>{f.title}</div>
              <div style={S.featureDesc}>{f.description}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ background: '#ffffff', borderTop: '1px solid #EBEBEB', borderBottom: '1px solid #EBEBEB' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '72px 32px' }}>
          <motion.h2
            style={S.sectionHeading}
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How it works
          </motion.h2>
          <p style={{ ...S.sectionSub, marginBottom: 44 }}>Three steps to a bulletproof wedding budget.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 36 }}>
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
                initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              >
                <div style={S.stepNum}>{s.num}</div>
                <div>
                  <div style={S.stepTitle}>{s.title}</div>
                  <div style={S.stepDesc}>{s.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats + bottom CTA ── */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '72px 32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              style={{
                padding: '16px 40px',
                borderRight: i < STATS.length - 1 ? '1px solid #EBEBEB' : 'none'
              }}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
            >
              <div style={S.statValue}>{stat.value}</div>
              <div style={S.statLabel}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => enter('client')}
            style={{
              padding: '15px 44px', borderRadius: 10,
              background: '#111', color: 'white',
              fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
              letterSpacing: '-0.2px', transition: 'background 0.2s',
              fontFamily: "'DM Sans', sans-serif"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#333' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#111' }}
          >
            Start Planning for Free →
          </button>
          <p style={{ fontSize: 12, color: '#bbb', marginTop: 14 }}>
            No signup · No credit card · Works on mobile
          </p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={S.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>💍</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>WeddingBudget.AI</span>
        </div>
        <div style={{ fontSize: 12, color: '#bbb' }}>Built for TCE Hackathon 2026 · Free forever</div>
        <button
          onClick={() => enter('admin')}
          style={{
            background: 'none', border: 'none', color: '#ccc',
            fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
          }}
        >
          Admin Login
        </button>
      </footer>
    </motion.div>
  )
}
