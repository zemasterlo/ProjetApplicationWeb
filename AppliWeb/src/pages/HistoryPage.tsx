
const FAKE_HISTORY = [
  { id: 1, date: '2026-03-30', word: 'TABLE', attempts: 3, result: 'Victoire', score: 30 },
  { id: 2, date: '2026-03-29', word: 'CHIEN', attempts: 6, result: 'Défaite', score: 0 },
  { id: 3, date: '2026-03-28', word: 'ARBRE', attempts: 2, result: 'Victoire', score: 50 },
  { id: 4, date: '2026-03-27', word: 'PIANO', attempts: 4, result: 'Victoire', score: 20 },
]

export default function HistoryPage() {
  // Pareil, GET jpense

  return (
    <div>
      <h1 style={styles.title}>Historique</h1>
      <p style={styles.hint}>Tes parties précédentes.</p>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Mot</th>
            <th style={styles.th}>Tentatives</th>
            <th style={styles.th}>Résultat</th>
            <th style={styles.th}>Score</th>
          </tr>
        </thead>
        <tbody>
          {FAKE_HISTORY.map((game) => (
            <tr key={game.id}>
              <td style={styles.td}>{game.date}</td>
              <td style={{ ...styles.td, fontWeight: 'bold', letterSpacing: '0.1em' }}>
                {game.word}
              </td>
              <td style={styles.td}>{game.attempts} / 6</td>
              <td style={styles.td}>
                <span style={{
                  ...styles.badge,
                  background: game.result === 'Victoire' ? '#e6f4ea' : '#fce8e6',
                  color: game.result === 'Victoire' ? '#137333' : '#c5221f',
                }}>
                  {game.result}
                </span>
              </td>
              <td style={styles.td}>{game.score} pts</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: '1.8rem',
    marginBottom: '0.25rem',
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
  badge: {
    display: 'inline-block',
    padding: '0.2rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
}
