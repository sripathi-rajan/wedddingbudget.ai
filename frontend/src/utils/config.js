// Auto-detects whether running locally or on production
// Usage: import { API_BASE } from '../utils/config'

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const fetcher = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}
