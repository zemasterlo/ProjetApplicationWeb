

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roomService, gameService, messageService, invitationService, userService } from '../services/api'
import type { Room, Message, User } from '../services/api'
import { wsService } from '../services/websocket'
import { Navbar } from '../components/Navbar'
import { useToast, ToastContainer } from '../hooks/useToast'

export function RoomPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toasts, show } = useToast()

  const [room, setRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState('')
  const [nombreRounds, setNombreRounds] = useState(3)
  const [loading, setLoading] = useState(true)

  const [inviteUsername, setInviteUsername] = useState('')
  const [inviting, setInviting] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const roomId = Number(id)

  const hasJoinedRef = useRef(false)


  const roomRef = useRef<Room | null>(null)
  useEffect(() => { roomRef.current = room }, [room])


  const isLeavingRef = useRef(false)

  const isOwner = room?.owner?.id === user?.id

  const loadRoom = useCallback(async () => {
    try {
      const [r, msgs] = await Promise.all([
        roomService.getRoom(id!),
        messageService.getRoom(roomId),
      ])

      const alreadyIn = r.joueurs?.some((j: any) => j.id === user?.id)

      if (!alreadyIn && !hasJoinedRef.current) {
        hasJoinedRef.current = true
        try {
          await roomService.joinRoom(r.code, user!.id)
          const updated = await roomService.getRoom(id!)
          setRoom(updated)
        } catch (err: any) {
          show(err.message || 'Impossible de rejoindre cette salle', 'error')
          navigate('/')
          return
        }
      } else {
        hasJoinedRef.current = true
        setRoom(r)
      }

      setMessages(msgs)
    } catch {
      show('Erreur chargement de la salle', 'error')
    } finally {
      setLoading(false)
    }
  }, [id, roomId, user])

  useEffect(() => {
    loadRoom()
  }, [loadRoom])


  useEffect(() => {
    if (!room?.code) return

    wsService.connect(room.code, (msg) => {
      switch (msg.type) {
        case 'PLAYER_JOINED':
          loadRoom()
          show(`${msg.data.username} a rejoint la salle`, 'info')
          break
        case 'PLAYER_LEFT':
          loadRoom()
          show(`${msg.data.username} a quitté la salle`, 'info')
          break
        case 'GAME_STARTED':
          isLeavingRef.current = true
          navigate(`/game/${roomId}`)
          break
        case 'NEW_MESSAGE':
          setMessages(prev => [...prev, {
            id: Date.now(),
            contenu: msg.data.contenu,
            user: { id: 0, username: msg.data.username, email: '', status: '' },
            heureEnvoi: new Date().toISOString(),
          }])
          break
      }
    })

    return () => wsService.disconnect()
  }, [room?.code])


  useEffect(() => {
    const handleUnload = () => {
      if (user && roomRef.current)
        navigator.sendBeacon(`/api/rooms/leave?code=${roomRef.current.code}&userId=${user.id}`)
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      if (!isLeavingRef.current && user && roomRef.current)
        roomService.leaveRoom(roomRef.current.code, user.id).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleStartGame() {
    if (!room) return
    try {
      await gameService.startGame(roomId, nombreRounds)
    } catch (err: any) {
      show(err.message || 'Impossible de démarrer', 'error')
    }
  }

  async function handleLeave() {
    if (!user || !room) return
    isLeavingRef.current = true
    try {
      await roomService.leaveRoom(room.code, user.id)
    } catch { }
    navigate('/')
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim() || !user) return
    try {
      await messageService.send(roomId, user.id, chatInput)
      setChatInput('')
    } catch {
      show('Erreur envoi', 'error')
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteUsername.trim() || !user || !room) return
    setInviting(true)
    try {
      const target = await userService.searchByUsername(inviteUsername.trim())
      if (target.id === user.id) {
        show('Tu ne peux pas t\'inviter toi-même', 'error')
        return
      }
      await invitationService.send(user.id, target.id, room.id)
      show(`Invitation envoyée à ${target.username} !`, 'success')
      setInviteUsername('')
    } catch (err: any) {
      if (err.status === 404) {
        show(`Joueur "${inviteUsername}" introuvable`, 'error')
      } else {
        show(err.message || 'Erreur invitation', 'error')
      }
    } finally {
      setInviting(false)
    }
  }

  if (loading) return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Chargement...
      </div>
    </div>
  )

  if (!room) return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--red)' }}>
        Salle introuvable.
      </div>
    </div>
  )

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={styles.layout}>

        <div style={styles.main}>

          {/* Header */}
          <div style={styles.roomHeader}>
            <div>
              <h1 style={styles.roomName}>{room.nom}</h1>
              <div style={styles.roomCode}>
                Code : <strong style={{ color: 'var(--gold)', letterSpacing: '0.15em' }}>{room.code}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                  (partage ce code pour inviter)
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => navigate(`/room/${roomId}/history`)}>Historique</button>
              <button className="btn-danger" onClick={handleLeave}>Quitter</button>
            </div>
          </div>

          {/* Joueurs */}
          <div className="card" style={styles.playersCard}>
            <h3 style={styles.cardTitle}>
              Joueurs ({room.joueurs?.length ?? 1} / {room.maxJoueurs})
            </h3>
            <div style={styles.playersList}>
              {room.joueurs?.map(p => (
                <div key={p.id} style={styles.playerRow}>
                  <div style={styles.playerAvatar}>
                    {p.username[0].toUpperCase()}
                  </div>
                  <div style={styles.playerName}>
                    {p.username}
                    {p.id === room.owner?.id && (
                      <span style={styles.ownerBadge}>👑 Hôte</span>
                    )}
                    {p.id === user?.id && (
                      <span style={{ ...styles.ownerBadge, background: 'rgba(79,142,255,0.15)', color: 'var(--accent)' }}>Toi</span>
                    )}
                  </div>
                  <span className="badge badge-online">prêt</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inviter */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={styles.cardTitle}>Inviter un joueur</h3>
            <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                value={inviteUsername}
                onChange={e => setInviteUsername(e.target.value)}
                placeholder="Pseudo du joueur (ex: alice)"
                style={{ flex: 1 }}
                autoComplete="off"
              />
              <button type="submit" className="btn-secondary" disabled={inviting || !inviteUsername.trim()}>
                {inviting ? '...' : 'Inviter'}
              </button>
            </form>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Ton pseudo : <strong style={{ color: 'var(--text-secondary)' }}>{user?.username}</strong>
            </p>
          </div>

          {/* Lancer la partie (seulement le chef) */}
          {isOwner ? (
            <div className="card" style={styles.startCard}>
              <h3 style={styles.cardTitle}>Lancer la partie</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nombre de rounds :</label>
                  <select
                    value={nombreRounds}
                    onChange={e => setNombreRounds(Number(e.target.value))}
                    style={{ width: '80px' }}
                  >
                    {[1, 2, 3, 5, 7].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn-success"
                  onClick={handleStartGame}
                  disabled={(room.joueurs?.length ?? 0) < 1}
                >
                  🚀 Lancer la partie !
                </button>
              </div>
              {(room.joueurs?.length ?? 0) < 2 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  En attente d'au moins un autre joueur...
                </p>
              )}
            </div>
          ) : (
            <div style={styles.waitingBanner}>
              <div style={styles.waitingDots}>
                <span /><span /><span />
              </div>
              En attente que l'hôte lance la partie
            </div>
          )}
        </div>

        {/* Chat */}
        <div style={styles.chatPanel}>
          <h3 style={styles.chatTitle}>Chat de la salle</h3>
          <div style={styles.chatMessages}>
            {messages.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                Aucun message...
              </div>
            )}
            {messages.map((m, i) => (
              <div key={m.id ?? i} style={styles.chatMsg}>
                <span style={{
                  fontWeight: 700,
                  color: m.user?.username === user?.username ? 'var(--accent)' : 'var(--gold)',
                  marginRight: '0.3rem',
                }}>
                  {m.user?.username}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{m.contenu}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleChat} style={styles.chatForm}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Message..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: 'var(--text-primary)' }}
            />
            <button type="submit" style={styles.chatSend}>↑</button>
          </form>
        </div>

      </div>

      <ToastContainer toasts={toasts} />

      <style>{`
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    gap: '1.5rem',
    maxWidth: '960px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
    alignItems: 'flex-start',
    width: '100%',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  roomHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
  },
  roomName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  roomCode: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '0.2rem',
  },
  cardTitle: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '1rem',
  },
  playersCard: {
    marginBottom: 0,
  },
  playersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--border)',
  },
  playerAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.9rem',
    color: 'var(--accent)',
  },
  playerName: {
    flex: 1,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  ownerBadge: {
    background: 'rgba(245,200,66,0.15)',
    color: 'var(--gold)',
    borderRadius: '999px',
    padding: '0.1rem 0.5rem',
    fontSize: '0.72rem',
    fontWeight: 700,
  },
  startCard: {
    borderColor: 'rgba(61,186,110,0.3)',
    background: 'rgba(61,186,110,0.04)',
  },
  waitingBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem 1.5rem',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  waitingDots: {
    display: 'flex',
    gap: '4px',
  },
  chatPanel: {
    width: '280px',
    flexShrink: 0,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    maxHeight: 'calc(100vh - 100px)',
  },
  chatTitle: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border)',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minHeight: '200px',
  },
  chatMsg: {
    fontSize: '0.88rem',
    lineHeight: 1.4,
  },
  chatForm: {
    display: 'flex',
    borderTop: '1px solid var(--border)',
    padding: '0.5rem 0.75rem',
    gap: '0.5rem',
    alignItems: 'center',
  },
  chatSend: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
}