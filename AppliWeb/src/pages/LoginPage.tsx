import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    //Gerer le login (????????????????)
    console.log('Login:', { username, password })
    navigate('/')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>TUSMO</h1>
        <h2 style={styles.subtitle}>Connexion</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Pseudo</label>
          <input
            style={styles.input}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ton pseudo"
            required
          />

          <label style={styles.label}>Mot de passe</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <button style={styles.btn} type="submit">
            Se connecter
          </button>
        </form>

        <p style={styles.footer}>
          Pas encore de compte ?{' '}
          <Link to="/register">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
  },
  card: {
    background: '#fff',
    padding: '2.5rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    width: '100%',
    maxWidth: '380px',
  },
  title: {
    textAlign: 'center',
    fontSize: '2rem',
    letterSpacing: '0.15em',
    marginBottom: '0.25rem',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: '1rem',
    fontWeight: 'normal',
    color: '#666',
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.85rem',
    color: '#444',
    marginTop: '0.5rem',
  },
  input: {
    padding: '0.6rem 0.75rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  btn: {
    marginTop: '1rem',
    padding: '0.75rem',
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.9rem',
    color: '#666',
  },
}
