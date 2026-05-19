import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { gameService, roomService, Room } from '../services/api'
import { useAuth } from '../context/AuthContext'

export function HistoryPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [games, setGames] = useState<any[]>([])
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!roomId) return
    const id = Number(roomId)
    Promise.all([
      roomService.getRoom(id),
      gameService.getHistory(id)
    ])
      .then(([roomData, historyData]) => {
        setRoom(roomData)
        setGames(historyData)
      })
      .catch((err: any) => setError(err.message || 'Erreur chargement'))
      .finally(() => setLoading(false))
  }, [roomId])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>
  if (error) return <div style={{ padding: '2rem', color: 'var(--red)', textAlign: 'center' }}>{error}</div>

  return (
    <div className="page-wrapper">
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <button className="btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
          ← Retour
        </button>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>Historique de la salle : <span style={{ color: 'var(--accent)' }}>{room?.nom}</span></h2>
          <p style={{ color: 'var(--text-muted)' }}>Code : {room?.code}</p>
        </div>

        {games.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucune partie terminée dans cette salle.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {games.map(game => (
              <div key={game.id} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <strong>Partie #{game.id}</strong>
                  <span className={`badge ${game.statut === 'FINISHED' ? 'badge-online' : 'badge-waiting'}`}>
                    {game.statut}
                  </span>
                </div>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <p>Début : {new Date(game.dateDebut).toLocaleString()}</p>
                  <p>Fin : {game.dateFin ? new Date(game.dateFin).toLocaleString() : '-'}</p>
                  <p>Rounds : {game.nombreRoundsTotal}</p>
                </div>

                {game.scores && game.scores.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem' }}>Joueur</th>
                        <th style={{ padding: '0.5rem' }}>Points</th>
                        <th style={{ padding: '0.5rem' }}>Essais</th>
                        <th style={{ padding: '0.5rem' }}>Temps (s)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {game.scores.map((score: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: score.username === user?.username ? 'var(--gold)' : 'inherit' }}>
                          <td style={{ padding: '0.5rem', fontWeight: score.username === user?.username ? 'bold' : 'normal' }}>
                            {score.username}
                          </td>
                          <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{score.points}</td>
                          <td style={{ padding: '0.5rem' }}>{score.nombreEssais}</td>
                          <td style={{ padding: '0.5rem' }}>{score.tempsTotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
