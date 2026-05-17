import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { userService } from '../services/api'

export default function Layout() {
  const navigate = useNavigate()

  async function handleLogout() {
    const userId = localStorage.getItem('userId')
    if (userId) {
      try {
        await userService.logout(Number(userId))
      } catch (err) {
        console.error('Erreur logout:', err)
      }
    }
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div>
      <nav style={styles.nav}>
        <span style={styles.logo}>TUSMO</span>
        <div style={styles.links}>
          <NavLink to="/" style={navStyle}>Lobby</NavLink>
          <NavLink to="/leaderboard" style={navStyle}>Classement</NavLink>
          <NavLink to="/history" style={navStyle}>Historique</NavLink>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Déconnexion
        </button>
      </nav>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

// NavLink reçoit un objet { isActive } pour le style actif
const navStyle = ({ isActive }: { isActive: boolean }) => ({
  ...styles.link,
  fontWeight: isActive ? 'bold' : 'normal',
  textDecoration: isActive ? 'underline' : 'none',
})

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '0.75rem 2rem',
    borderBottom: '1px solid #ccc',
    background: '#fff',
  },
  logo: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    marginRight: 'auto',
    letterSpacing: '0.1em',
  },
  links: {
    display: 'flex',
    gap: '1.5rem',
  },
  link: {
    color: '#333',
    textDecoration: 'none',
  },
  logoutBtn: {
    cursor: 'pointer',
    padding: '0.4rem 1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: 'transparent',
  },
  main: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
}
