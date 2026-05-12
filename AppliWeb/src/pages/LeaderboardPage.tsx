import { useState, useEffect } from 'react';
// --- MODIFICATION : Import du service pour le score ---
import { scoreService } from '../services/api';

export default function LeaderboardPage() {
  // --- MODIFICATION : Ajout du state de classement ---
  const [ranking, setRanking] = useState<any[]>([]);

  // --- MODIFICATION : Fetch classement sur mount ---
  useEffect(() => {
    // Note: l'API attend un gameId, ici on mocke avec gameId=1
    scoreService.getLeaderboard(1)
      .then(data => setRanking(data))
      .catch(err => console.error("Erreur récupération leaderboard:", err));
  }, []);

  return (
    <div>
      <h1>Classement</h1>
      <p>Les meilleurs joueurs de la plateforme (pour la Game 1).</p>

      <div>
        <table>
          <thead>
            <tr>
              <th>ID Score</th>
              <th>Essais</th>
              <th>Temps total (s)</th>
            </tr>
          </thead>
          <tbody>
            {ranking.length === 0 && (
              <tr><td colSpan={3}>Aucun score enregistré</td></tr>
            )}
            {ranking.map((entry, idx) => (
              <tr key={entry.id}>
                <td>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </td>
                <td>{entry.nombreEssais} essais</td>
                <td>{entry.tempsTotalSecondes} s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
