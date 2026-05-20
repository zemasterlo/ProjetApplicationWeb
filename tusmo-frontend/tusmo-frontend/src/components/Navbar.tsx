
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div
        className="navbar-logo"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        TUS<span>MO</span>
      </div>

      {user && (
        <div className="navbar-user">
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {user.username}
          </span>
          <span className="badge badge-online">en ligne</span>
          <button className="btn-icon" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  )
}
