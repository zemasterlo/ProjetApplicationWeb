

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roomService, invitationService } from '../services/api'
import type { Room, Invitation } from '../services/api'
import { wsService } from '../services/websocket'
import { Navbar } from '../components/Navbar'
import { useToast, ToastContainer } from '../hooks/useToast'

export function LobbyPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toasts, show } = useToast()

  const [rooms, setRooms] = useState<Room[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)


  const [showCreate, setShowCreate] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)

  const [joinCode, setJoinCode] = useState('')

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const [r, inv] = await Promise.all([
        roomService.getWaiting(),
        invitationService.getPending(user.id),
      ])
      setRooms(r)
      setInvitations(inv)
    } catch {
      show('Erreur chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
    if (user) {
      wsService.connectUser(user.id, (msg) => {
        if (msg.type === 'INVITATION_RECEIVED') {
          show(msg.message || 'Nouvelle invitation !', 'info')
          loadData() 
        }
      })
    }
    const interval = setInterval(loadData, 5000)
    return () => {
      clearInterval(interval)
      wsService.disconnectUser()
    }
  }, [loadData, user])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !roomName.trim()) return
    try {
      const room = await roomService.createRoom(roomName, user.id, maxPlayers)
      navigate(`/room/${room.id}`)
    } catch (err: any) {
      show(err.message || 'Erreur création', 'error')
    }
  }

  async function handleJoin(roomId: number, code: string) {
    if (!user) return
    try {
      await roomService.joinRoom(code, user.id)
      navigate(`/room/${roomId}`)
    } catch (err: any) {
      show(err.message || 'Impossible de rejoindre', 'error')
    }
  }

  async function handleJoinByCode(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !joinCode.trim()) return
    try {
      const room = await roomService.joinRoom(joinCode.toUpperCase(), user.id)
      navigate(`/room/${room.id}`)
    } catch (err: any) {
      show(err.message || 'Code invalide', 'error')
    }
  }

  async function handleAcceptInvitation(inv: Invitation) {
    if (!user) return
    try {
      await invitationService.accept(inv.id)
      await roomService.joinRoom(inv.room.code, user.id)
      navigate(`/room/${inv.room.id}`)
    } catch (err: any) {
      show(err.message || 'Erreur', 'error')
    }
  }

  async function handleRefuseInvitation(invId: number) {
    try {
      await invitationService.refuse(invId)
      setInvitations(prev => prev.filter(i => i.id !== invId))
    } catch {
      show('Erreur', 'error')
    }
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      <div style={styles.content}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Salon de jeu</h1>
            <p style={styles.subtitle}>Rejoins une salle ou crée la tienne</p>
          </div>
          <div style={styles.headerActions}>
            <button
              className="btn-primary"
              onClick={() => setShowCreate(!showCreate)}
            >
              + Créer une salle
            </button>
          </div>
        </div>

        {/* Invitations */}
        {invitations.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span style={{ color: 'var(--gold)' }}>📩</span> Invitations
            </h2>
            <div style={styles.grid}>
              {invitations.map(inv => (
                <div key={inv.id} className="card" style={styles.invCard}>
                  <div>
                    <div style={styles.invFrom}>
                      <strong>{inv.expediteur.username}</strong> t'invite à jouer
                    </div>
                    <div style={styles.invRoom}>{inv.room.nom}</div>
                  </div>
                  <div style={styles.invActions}>
                    <button className="btn-success" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => handleAcceptInvitation(inv)}>
                      Accepter
                    </button>
                    <button className="btn-danger" onClick={() => handleRefuseInvitation(inv.id)}>
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Room */}
        {showCreate && (
          <div className="card" style={styles.createPanel}>
            <h3 style={styles.createTitle}>Nouvelle salle</h3>
            <form onSubmit={handleCreate} style={styles.createForm}>
              <div style={styles.field}>
                <label style={styles.label}>Nom de la salle</label>
                <input
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="ex: La salle des pros"
                  autoFocus
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Joueurs max</label>
                <select value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))}>
                  {[2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} joueurs</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn-primary">Créer</button>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Annuler</button>
              </div>
            </form>
          </div>
        )}

        {/* Rejoindre avec le code*/}
        <div style={styles.section}>
          <form onSubmit={handleJoinByCode} style={styles.joinCodeRow}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Code de salle (ex: AB3X7)"
              style={{ flex: 1, letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}
              maxLength={8}
            />
            <button type="submit" className="btn-secondary">
              Rejoindre par code
            </button>
          </form>
        </div>

        {/* liste des rooms disponibles  */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <span style={{ color: 'var(--accent)' }}>🏠</span> Salles disponibles
            </h2>
            <button className="btn-icon" onClick={loadData}>↻ Actualiser</button>
          </div>

          {loading ? (
            <div style={styles.empty}>Chargement...</div>
          ) : rooms.length === 0 ? (
            <div style={styles.empty}>
              Aucune salle en attente. Sois le premier à en créer une !
            </div>
          ) : (
            <div style={styles.roomList}>
              {rooms.map(room => (
                <div key={room.id} className="card" style={styles.roomCard}>
                  <div style={styles.roomLeft}>
                    <div style={styles.roomName}>{room.nom}</div>
                    <div style={styles.roomMeta}>
                      Créée par <strong>{room.owner?.username}</strong>
                      <span style={styles.dot}>·</span>
                      {room.joueurs?.length ?? 1}/{room.maxJoueurs} joueurs
                    </div>
                    <div style={styles.roomPlayers}>
                      {room.joueurs?.map(j => (
                        <span key={j.id} style={styles.playerChip}>{j.username}</span>
                      ))}
                    </div>
                  </div>
                  <div style={styles.roomRight}>
                    <span className="badge badge-waiting">En attente</span>
                    <button
                      className="btn-primary"
                      style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
                      onClick={() => handleJoin(room.id, room.code)}
                      disabled={room.joueurs?.length >= room.maxJoueurs}
                    >
                      Rejoindre
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <ToastContainer toasts={toasts} />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.2rem',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  invCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: 'rgba(245,200,66,0.3)',
    background: 'rgba(245,200,66,0.04)',
  },
  invFrom: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    marginBottom: '0.2rem',
  },
  invRoom: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  invActions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  createPanel: {
    marginBottom: '2rem',
    borderColor: 'var(--accent)',
  },
  createTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    color: 'var(--accent)',
    marginBottom: '1rem',
  },
  createForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  joinCodeRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  roomList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  roomCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'border-color 0.18s',
  },
  roomLeft: {
    flex: 1,
  },
  roomName: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  roomMeta: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    marginBottom: '0.5rem',
  },
  dot: {
    margin: '0 0.3rem',
  },
  roomPlayers: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.3rem',
  },
  playerChip: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '999px',
    padding: '0.1rem 0.6rem',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  roomRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.5rem',
  },
  empty: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    padding: '3rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px dashed var(--border)',
    fontSize: '0.9rem',
  },
}
