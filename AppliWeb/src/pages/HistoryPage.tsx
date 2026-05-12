import { useState, useEffect } from 'react';
// --- MODIFICATION : Import du service pour historique ---
import { gameService } from '../services/api';

export default function HistoryPage() {
  // --- MODIFICATION : Ajout du state d'historique ---
  const [history, setHistory] = useState<any[]>([]);

  // --- MODIFICATION : Fetch de l'historique sur mount ---
  useEffect(() => {
    // Par exemple on fetch l'historique de la room 1,
    // (Dans un cas réel on chercherait via le GameService pour User)
    gameService.getGamesHistory(1)
      .then(data => setHistory(data))
      .catch(err => console.error("Erreur historique:", err));
  }, []);

  return (
    <div>
      <h1>Historique</h1>
      <p>Tes parties précédentes.</p>

      <div>
        <table>
          <thead>
            <tr>
              <th>ID Game</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td colSpan={2}>Aucune partie trouvée.</td></tr>
            )}
            {history.map((game) => (
              <tr key={game.id}>
                <td>{game.id}</td>
                <td>
                  <span>
                    {game.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
