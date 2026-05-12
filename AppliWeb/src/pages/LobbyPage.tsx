import { useNavigate } from 'react-router-dom'

// Données fictives pour visualiser la page
const FAKE_GAMES = [
  { id: 1, host: 'Alice', players: 1, maxPlayers: 2, wordLength: 6, status: 'En attente' },
  { id: 2, host: 'Bob', players: 2, maxPlayers: 4, wordLength: 7, status: 'En attente' },
  { id: 3, host: 'Charlie', players: 1, maxPlayers: 2, wordLength: 5, status: 'En attente' },
]

export default function LobbyPage() {
  const navigate = useNavigate()

  function handleCreate() {
    // ptdrrrrrrr on fait comment ?
    navigate('/game/1')
  }

  function handleJoin(id: number) {
    // ?
    navigate(`/game/${id}`)
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Lobby</h1>
        <button style={styles.createBtn} onClick={handleCreate}>
          + Créer une partie
        </button>
      </div>

      <p style={styles.hint}>Rejoins une partie existante ou crée la tienne.</p>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Hôte</th>
            <th style={styles.th}>Joueurs</th>
            <th style={styles.th}>Longueur du mot</th>
            <th style={styles.th}>Statut</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {FAKE_GAMES.map((game) => (
            <tr key={game.id}>
              <td style={styles.td}>{game.host}</td>
              <td style={styles.td}>{game.players} / {game.maxPlayers}</td>
              <td style={styles.td}>{game.wordLength} lettres</td>
              <td style={styles.td}>{game.status}</td>
              <td style={styles.td}>
                <button style={styles.joinBtn} onClick={() => handleJoin(game.id)}>
                  Rejoindre
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '1.8rem',
  },
  createBtn: {
    padding: '0.6rem 1.2rem',
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  hint: {
    color: '#666',
    marginBottom: '1.5rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '0.6rem 1rem',
    background: '#f0f0f0',
    borderBottom: '1px solid #ddd',
    fontSize: '0.85rem',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  td: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #eee',
  },
  joinBtn: {
    padding: '0.4rem 0.9rem',
    border: '1px solid #1a73e8',
    color: '#1a73e8',
    background: 'transparent',
    borderRadius: '4px',
    cursor: 'pointer',
  },
}
