// ============================================================
// pages/LoginPage.tsx
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast, ToastContainer } from '../hooks/useToast'

export function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const { toasts, show } = useToast()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) {
      show('Remplis tous les champs', 'error')
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        if (!email) { show('Email requis', 'error'); setLoading(false); return }
        await register(username, email, password)
      }
      navigate('/')
    } catch (err: any) {
      show(err.message || 'Erreur de connexion', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.root}>
      {/* Background decorative grid */}
      <div style={styles.bgGrid} />

      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logo}>
          TUS<span style={{ color: 'var(--gold)' }}>MO</span>
        </div>
        <p style={styles.tagline}>Le Wordle multijoueur en temps réel</p>

        {/* Card */}
        <div className="card" style={styles.card}>
          {/* Tab switcher */}
          <div style={styles.tabs}>
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => setMode(t)}
                style={{
                  ...styles.tab,
                  ...(mode === t ? styles.tabActive : {}),
                }}
              >
                {t === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Nom d'utilisateur</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ex: lexmaster42"
                style={styles.input}
                autoFocus
              />
            </div>

            {mode === 'register' && (
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ton@email.fr"
                  style={styles.input}
                />
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}
            >
              {loading
                ? '...'
                : mode === 'login'
                ? '🚀 Se connecter'
                : '✨ Créer un compte'}
            </button>
          </form>
        </div>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bgGrid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(79,142,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(79,142,255,0.04) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
  },
  container: {
    position: 'relative',
    textAlign: 'center',
    width: '100%',
    maxWidth: '420px',
    padding: '1.5rem',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '3rem',
    fontWeight: 900,
    color: 'var(--accent)',
    letterSpacing: '0.1em',
    marginBottom: '0.25rem',
  },
  tagline: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    marginBottom: '2rem',
    fontWeight: 500,
  },
  card: {
    padding: '2rem',
  },
  tabs: {
    display: 'flex',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface)',
    padding: '4px',
    gap: '4px',
    marginBottom: '1.5rem',
  },
  tab: {
    flex: 1,
    padding: '0.5rem',
    borderRadius: '6px',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.18s',
    fontFamily: 'var(--font-body)',
  },
  tabActive: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    textAlign: 'left',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
  },
}
