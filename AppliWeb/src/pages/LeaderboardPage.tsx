
const FAKE_RANKING = [
  { rank: 1, username: 'Alice', wins: 42, played: 50, winRate: 84 },
  { rank: 2, username: 'Bob', wins: 35, played: 48, winRate: 73 },
  { rank: 3, username: 'Charlie', wins: 28, played: 40, winRate: 70 },
  { rank: 4, username: 'Diana', wins: 20, played: 35, winRate: 57 },
  { rank: 5, username: 'Eric', wins: 15, played: 30, winRate: 50 },
]

export default function LeaderboardPage() {
  // faut trouver un moyen d'update le truc en direct, GET ? 

  return (
    <div>
      <h1 style={styles.title}>Classement</h1>
      <p style={styles.hint}>Les meilleurs joueurs de la plateforme.</p>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Joueur</th>
            <th style={styles.th}>Victoires</th>
            <th style={styles.th}>Parties jouées</th>
            <th style={styles.th}>% victoires</th>
          </tr>
        </thead>
        <tbody>
          {FAKE_RANKING.map((entry) => (
            <tr key={entry.rank} style={entry.rank <= 3 ? styles.topRow : {}}>
              <td style={styles.td}>
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
              </td>
              <td style={{ ...styles.td, fontWeight: entry.rank <= 3 ? 'bold' : 'normal' }}>
                {entry.username}
              </td>
              <td style={styles.td}>{entry.wins}</td>
              <td style={styles.td}>{entry.played}</td>
              <td style={styles.td}>{entry.winRate}%</td>
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
  topRow: {
    background: '#fffbea',
  },
}
