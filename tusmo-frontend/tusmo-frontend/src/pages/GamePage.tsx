// ============================================================
// pages/GamePage.tsx — La page de jeu Tusmo
// CORRECTIONS INTEGREES :
//  - L'utilisateur tape les lettres APRES la première (qui est pré-remplie)
//    → frontend préfixe automatiquement avant d'envoyer au backend
//  - La grille est construite atomiquement depuis les guesses existants
//    (plus de race condition entre initGrid + setGrid)
//  - handleWebSocketMessage encapsulé dans useCallback
//  - Anti-race condition sur les changements de round (via refs)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  roomService, messageService, gameService, guessService, scoreService,
} from '../services/api'
import type { Message, Score } from '../services/api'
import { wsService } from '../services/websocket'
import { Navbar } from '../components/Navbar'
import { useToast, ToastContainer } from '../hooks/useToast'

// ─── Types ────────────────────────────────────────────────────
type CellState = 'correct' | 'present' | 'absent' | 'empty'

interface Cell {
  letter: string
  state: CellState
  flip?: boolean
}

interface OpponentInfo {
  username: string
  tentatives: number
  aGagne: boolean
  maxTentatives: number
}

const MAX_TENTATIVES = 6

const CELL_BG: Record<CellState, string> = {
  correct: 'var(--correct)',
  present: 'var(--present)',
  absent:  'var(--absent)',
  empty:   'var(--bg-elevated)',
}

// ─── Helpers ──────────────────────────────────────────────────

/** Construit une grille vide avec la première lettre pré-remplie */
function buildEmptyGrid(wordLen: number, firstLetter: string): Cell[][] {
  return Array.from({ length: MAX_TENTATIVES }, () =>
    Array.from({ length: wordLen }, (_, c) => ({
      letter: c === 0 ? firstLetter.toUpperCase() : '',
      state: 'empty' as CellState,
    }))
  )
}

/**
 * Parse le résultat "C,P,A,A,C" en cellules colorées.
 * IMPORTANT : motPropose vient du backend tel que soumis (sans la première lettre dupliquée).
 */
function parseResultat(mot: string, resultat: string): Cell[] {
  const lettres = mot.split('')
  const etats   = resultat.split(',')
  return lettres.map((letter, i) => ({
    letter,
    state: etats[i] === 'C' ? 'correct' : etats[i] === 'P' ? 'present' : 'absent',
    flip: true,
  }))
}

/**
 * Reconstruit la grille complète depuis un tableau de guesses (reprise de partie).
 * Toujours atomique : pas de double setGrid.
 */
function buildGridFromGuesses(
  wordLen: number,
  firstLetter: string,
  guesses: Array<{ motPropose: string; resultatLettres: string }>
): Cell[][] {
  const grid = buildEmptyGrid(wordLen, firstLetter)
  guesses.forEach((g, i) => {
    if (i < MAX_TENTATIVES) {
      grid[i] = parseResultat(g.motPropose, g.resultatLettres)
    }
  })
  return grid
}

// ─── Component ────────────────────────────────────────────────
export function GamePage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toasts, show } = useToast()

  const roomId = Number(id)
  const username = user?.username ?? ''

  // Round state
  const [gameId,            setGameId]            = useState<number | null>(null)
  const [roundId,           setRoundId]           = useState<number | null>(null)
  const [premiereLettre,    setPremiereLettre]     = useState('')
  const [longueurMot,       setLongueurMot]        = useState(5)
  const [numeroRound,       setNumeroRound]        = useState(1)
  const [nombreRoundsTotal, setNombreRoundsTotal]  = useState(3)
  const [roomCode,          setRoomCode]           = useState('')
  const roomCodeRef = useRef('')

  // Grid
  const [grid,        setGrid]        = useState<Cell[][]>([])
  const [tentativeNum, setTentativeNum] = useState(0)
  const [roundWon,    setRoundWon]    = useState(false)
  const [roundLost,   setRoundLost]   = useState(false)
  const [gameFinished,setGameFinished] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [shakeRow,    setShakeRow]    = useState(false)

  // Input — l'user tape les lettres APRÈS la première
  const [input, setInput] = useState('')

  // Chat
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [chatInput,    setChatInput]    = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Opponents
  const [opponents, setOpponents] = useState<OpponentInfo[]>([])

  // Leaderboard
  const [leaderboard,   setLeaderboard]   = useState<Score[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // Classement final (données directement dans l'event GAME_ENDED)
  const [classement, setClassement] = useState<ClassementEntry[]>([])

  // Info banner
  const [infoMessage, setInfoMessage] = useState('')

  // ─── Refs anti-race-condition ────────────────────────────────
  /**
   * roundIdRef : miroir ref de l'état roundId.
   * Mis à jour immédiatement à chaque changement de round (WS ou init),
   * il permet à handleGuess de détecter — après son await — si le round
   * a changé pendant l'appel réseau, et d'abandonner l'application du
   * résultat périmé.
   */
  const roundIdRef = useRef<number | null>(null)

  /**
   * wsRoundIdRef : dernier roundId reçu via WebSocket (NEW_ROUND / GAME_STARTED).
   * Utilisé dans init() pour ne pas écraser l'état déjà posé par le WS
   * si getActiveGameState() se résout après un NEW_ROUND.
   */
  const wsRoundIdRef = useRef<number | null>(null)

  /** Raccourci : positionne roundId dans l'état ET dans le ref en même temps. */
  const applyRoundId = (id: number) => {
    setRoundId(id)
    roundIdRef.current = id
  }

  // ─── Init ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return

    async function init() {
      try {
        const room = await roomService.getRoom(id!)
        setRoomCode(room.code)
        roomCodeRef.current = room.code

        // Load chat history
        const msgs = await messageService.getRoom(roomId)
        setChatMessages(msgs)

        // Try to resume an active game
        const state = await gameService.getActiveGameState(roomId, user!.id).catch(() => null)

        if (state) {
          setGameStarted(true)
          setGameId(state.gameId)
          applyRoundId(state.roundId)
          setPremiereLettre(state.premiereLettre)
          setLongueurMot(state.longueurMot)
          setNumeroRound(state.numeroRound)
          setNombreRoundsTotal(state.nombreRoundsTotal)

          // ── Fix race condition init vs NEW_ROUND ──────────────
          // Si le WS a déjà reçu un NEW_ROUND pour un round DIFFÉRENT
          // (c.-à-d. getActiveGameState s'est résolu APRÈS le WS),
          // on ne réapplique pas les guesses/roundLost/roundWon périmés :
          // le WS a déjà positionné la grille et les flags correctement.
          const wsRoundId = wsRoundIdRef.current
          const apiIsStale = wsRoundId !== null && wsRoundId !== state.roundId

          if (!apiIsStale) {
            const guesses = state.guesses ?? []
            // ATOMIC: build grid + set tentativeNum in one shot
            setGrid(buildGridFromGuesses(state.longueurMot, state.premiereLettre, guesses))
            setTentativeNum(guesses.length)

            const won  = guesses.some(g => g.estCorrect)
            const lost = !won && guesses.length >= MAX_TENTATIVES
            if (won)  { setRoundWon(true);  setInfoMessage('Tu as déjà trouvé ce mot ! 🎉') }
            if (lost) { setRoundLost(true); setInfoMessage('Tu avais épuisé tes essais.') }
            if (!won && !lost) setInfoMessage('Partie reprise, bonne chance !')
          }
        }
      } catch (err) {
        console.error('Init error:', err)
      }
    }

    init()
    return () => wsService.disconnect()
  }, [id, user])

  // ─── WebSocket ──────────────────────────────────────────────
  // On utilise un ref pour éviter que le WS se reconnecte à chaque
  // changement de state (ce qui causait la perte des events de round).
  const wsStateRef = useRef({ username, nombreRoundsTotal, gameId })
  useEffect(() => {
    wsStateRef.current = { username, nombreRoundsTotal, gameId }
  })

  const handleWsMessage = useCallback((msg: any) => {
    const { username, nombreRoundsTotal, gameId } = wsStateRef.current
    switch (msg.type) {
      case 'GAME_STARTED':
        wsRoundIdRef.current = msg.data.roundId  // ← fix race condition init
        setGameStarted(true)
        if (msg.data.gameId) setGameId(msg.data.gameId) // ← capture gameId depuis le WS
        applyRoundId(msg.data.roundId)
        setPremiereLettre(msg.data.premiereLettre)
        setLongueurMot(msg.data.longueurMot)
        setNumeroRound(msg.data.numeroRound)
        setNombreRoundsTotal(msg.data.nombreRoundsTotal ?? 3)
        setGrid(buildEmptyGrid(msg.data.longueurMot, msg.data.premiereLettre))
        setRoundWon(false)
        setRoundLost(false)
        setTentativeNum(0)
        setInfoMessage('La partie commence ! 🎯')
        break

      case 'GUESS_MADE':
        if (msg.data.username !== username) {
          setOpponents(prev => {
            const exists = prev.find(o => o.username === msg.data.username)
            const updated = {
              username: msg.data.username,
              tentatives: msg.data.numeroEssai,
              aGagne: msg.data.estCorrect,
              maxTentatives: MAX_TENTATIVES,
            }
            return exists
              ? prev.map(o => o.username === msg.data.username ? updated : o)
              : [...prev, updated]
          })
        }
        break

      case 'ROUND_ENDED':
        setInfoMessage(`Round ${msg.data.numeroRound} terminé ! Le mot était : ${msg.data.motCorrect}`)
        break

      case 'NEW_ROUND':
        wsRoundIdRef.current = msg.data.roundId  // ← fix race condition init
        applyRoundId(msg.data.roundId)
        setPremiereLettre(msg.data.premiereLettre)
        setLongueurMot(msg.data.longueurMot)
        setNumeroRound(msg.data.numeroRound)
        setGrid(buildEmptyGrid(msg.data.longueurMot, msg.data.premiereLettre))
        setRoundWon(false)
        setRoundLost(false)
        setTentativeNum(0)
        setInput('')          // ← Vider l'input du round précédent
        setOpponents([])
        setInfoMessage(`Round ${msg.data.numeroRound} / ${nombreRoundsTotal} — À vous ! 🎯`)
        break

      case 'GAME_ENDED':
        setGameFinished(true)
        setInfoMessage('Partie terminée !')
        // Le classement est directement dans le message WS (username, points, nombreEssais)
        if (msg.data.classement && Array.isArray(msg.data.classement)) {
          setClassement(msg.data.classement)
        }
        setShowLeaderboard(true)
        // Fallback : si le classement WS est vide, tenter l'API avec gameId
        if (!msg.data.classement || msg.data.classement.length === 0) {
          const { gameId } = wsStateRef.current
          if (gameId) {
            scoreService.getLeaderboard(gameId).then(scores => {
              setLeaderboard(scores)
            }).catch(() => {})
          }
        }
        break

      case 'NEW_MESSAGE':
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          contenu: msg.data.contenu,
          user: { id: 0, username: msg.data.username, email: '', status: '' },
          heureEnvoi: new Date().toISOString(),
        }])
        break
    }
  }, []) // ← dépendances vides : on lit les valeurs fraîches via wsStateRef

  // Connect WS when roomCode is known
  useEffect(() => {
    if (!roomCode) return
    wsService.connect(roomCode, handleWsMessage)
    return () => wsService.disconnect()
  }, [roomCode, handleWsMessage])

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ─── Guess ──────────────────────────────────────────────────
  async function handleGuess(e: React.FormEvent) {
    e.preventDefault()
    if (!roundId || !user || roundWon || roundLost || gameFinished) return

    // Le joueur tape les lettres APRES la première
    // → mot complet = premiereLettre + input
    const motComplet = (premiereLettre + input).toUpperCase()

    if (motComplet.length !== longueurMot) {
      show(`Il faut ${longueurMot - 1} lettre(s) après le "${premiereLettre}"`, 'error')
      setShakeRow(true)
      setTimeout(() => setShakeRow(false), 500)
      return
    }

    // ── Fix stale-closure : capture le roundId AVANT l'await ──
    const capturedRoundId = roundId

    try {
      const result = await guessService.submit(roundId, user.id, motComplet)

      // Vérification post-await : le round a-t-il changé pendant l'appel ?
      if (roundIdRef.current !== capturedRoundId) {
        return
      }

      const cells = parseResultat(result.motPropose, result.resultatLettres)

      // numeroEssai est 1-based côté serveur.
      const essai = result.numeroEssai ?? (tentativeNum + 1)
      const serverRow = essai - 1   // 0-based pour la grille

      setGrid(prev => {
        const next = [...prev]
        next[serverRow] = cells
        return next
      })
      setTentativeNum(essai)
      setInput('')

      if (result.estCorrect) {
        setRoundWon(true)
        setInfoMessage('Bravo ! Tu as trouvé le mot ! 🎉')
        show('Bravo ! 🎉', 'success')
      } else if (essai >= MAX_TENTATIVES) {
        setRoundLost(true)
        setInfoMessage('Tu as épuisé tes essais...')
        show('Plus d\'essais...', 'error')
      }
    } catch (err: any) {
      const msg = err.message || 'Erreur'
      show(msg, 'error')
      setShakeRow(true)
      setTimeout(() => setShakeRow(false), 500)
    }
  }

  // ─── Chat ───────────────────────────────────────────────────
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

  // ─── Leave ──────────────────────────────────────────────────
  async function handleLeave() {
    if (!user) return
    try {
      if (roomCode) await roomService.leaveRoom(roomCode, user.id)
    } catch {}
    navigate('/')
  }

  // Retour navigateur (flèche ←) + fermeture d'onglet
  useEffect(() => {
    const handlePopState = () => {
      if (user && roomCodeRef.current)
        roomService.leaveRoom(roomCodeRef.current, user.id).catch(() => {})
    }
    const handleUnload = () => {
      if (user && roomCodeRef.current)
        navigator.sendBeacon(`/api/rooms/leave?code=${roomCodeRef.current}&userId=${user.id}`)
    }
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [user])

  // ─── Render ─────────────────────────────────────────────────
  const lettersLeft = longueurMot - 1 // number of letters the user types

  return (
    <div className="page-wrapper">
      <Navbar />

      <div style={styles.layout}>

        {/* ── GAME COLUMN ─────────────────────────────────── */}
        <div style={styles.gameCol}>

          {/* Round header */}
          <div style={styles.gameHeader}>
            <div>
              <div style={styles.roundBadge}>
                Round <strong>{numeroRound}</strong> / {nombreRoundsTotal}
              </div>
              <h2 style={styles.gameTitle}>
                {gameStarted
                  ? `Mot de ${longueurMot} lettres commençant par `
                  : 'En attente du lancement...'}
                {gameStarted && (
                  <span style={styles.firstLetter}>{premiereLettre}</span>
                )}
              </h2>
            </div>
            <button className="btn-danger" onClick={handleLeave}>Quitter</button>
          </div>

          {/* Info banner */}
          {infoMessage && (
            <div style={{
              ...styles.infoBanner,
              borderColor: roundWon ? 'var(--correct)' :
                           roundLost ? 'var(--red)' : 'var(--border-light)',
              color: roundWon ? 'var(--green)' :
                     roundLost ? 'var(--red)' : 'var(--text-secondary)',
            }}>
              {infoMessage}
            </div>
          )}

          {gameStarted && (
            <>
              {/* Attempt counter */}
              <div style={styles.tentativeInfo}>
                Tentative{' '}
                <strong style={{ color: 'var(--accent)' }}>
                  {Math.min(tentativeNum + 1, MAX_TENTATIVES)}
                </strong>
                {' '}/ {MAX_TENTATIVES}
              </div>

              {/* ── GRID ─────────────────────────────────── */}
              <div style={styles.grid}>
                {grid.map((row, rowIdx) => (
                  <div
                    key={rowIdx}
                    style={{
                      ...styles.row,
                      // Anime la ligne courante
                      animation: shakeRow && rowIdx === tentativeNum ? 'shake 0.4s ease' : undefined,
                    }}
                  >
                    {row.map((cell, colIdx) => (
                      <div
                        key={colIdx}
                        style={{
                          ...styles.cell,
                          background: CELL_BG[cell.state],
                          border: cell.state === 'empty'
                            ? '2px solid var(--empty-border)'
                            : '2px solid transparent',
                          color: cell.state === 'empty' ? 'var(--text-primary)' : '#fff',
                          animationDelay: cell.flip ? `${colIdx * 80}ms` : '0ms',
                        }}
                        className={cell.flip ? 'cell-flip' : undefined}
                      >
                        {cell.letter}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* ── INPUT ────────────────────────────────── */}
              {!roundWon && !roundLost && !gameFinished && (
                <form onSubmit={handleGuess} style={styles.inputRow}>
                  <div style={styles.inputWrapper}>
                    {/* First letter prefix (read-only) */}
                    <div style={styles.prefixLetter}>{premiereLettre}</div>
                    <input
                      style={styles.guessInput}
                      type="text"
                      value={input}
                      onChange={e => {
                        const v = e.target.value.toUpperCase().replace(/[^A-ZÉÈÊËÀÂÙÛÜÎÏÔÇ]/gi, '')
                        if (v.length <= lettersLeft) setInput(v)
                      }}
                      maxLength={lettersLeft}
                      placeholder={`${'_'.repeat(lettersLeft)} (${lettersLeft} lettres)`}
                      autoFocus
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={input.length !== lettersLeft}
                  >
                    Valider
                  </button>
                </form>
              )}

              {/* ── KEYBOARD HINT (mini keyboard) ────────── */}
              {!roundWon && !roundLost && !gameFinished && (
                <KeyboardHint grid={grid} longueurMot={longueurMot} input={input} />
              )}
            </>
          )}

          {/* Opponents */}
          {opponents.length > 0 && (
            <div className="card" style={styles.opponentsCard}>
              <h4 style={styles.opponentsTitle}>Adversaires</h4>
              {opponents.map(op => (
                <div key={op.username} style={styles.opponentRow}>
                  <div style={styles.opponentAvatar}>
                    {op.username[0].toUpperCase()}
                  </div>
                  <div style={styles.opponentName}>{op.username}</div>
                  <div>
                    {op.aGagne ? (
                      <span style={{ color: 'var(--green)', fontWeight: 700 }}>✅ Trouvé !</span>
                    ) : (
                      <div style={styles.opponentDots}>
                        {Array.from({ length: MAX_TENTATIVES }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              ...styles.opponentDot,
                              background: i < op.tentatives ? 'var(--accent)' : 'var(--border)',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scoreboard overlay fin de partie */}
          {showLeaderboard && (
            <ScoreboardOverlay
              classement={classement.length > 0 ? classement : leaderboard.map((s, i) => ({
                rang: i + 1,
                username: s.user?.username ?? `Joueur ${i + 1}`,
                points: s.points ?? 0,
                nombreEssais: s.nombreEssais ?? 0,
              }))}
              currentUsername={username}
              onClose={async () => {
                if (gameId) {
                  try { await gameService.deleteGame(gameId) } catch {}
                }
                navigate('/')
              }}
            />
          )}
        </div>

        {/* ── CHAT COLUMN ─────────────────────────────────── */}
        <div style={styles.chatPanel}>
          <h3 style={styles.chatTitle}>Chat</h3>
          <div style={styles.chatMessages}>
            {chatMessages.map((m, i) => (
              <div key={m.id ?? i} style={styles.chatMsg}>
                <span style={{
                  fontWeight: 700,
                  color: m.user?.username === username ? 'var(--accent)' : 'var(--gold)',
                  marginRight: '0.3rem',
                }}>
                  {m.user?.username}
                </span>
                <span>{m.contenu}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleChat} style={styles.chatForm}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Message..."
              style={styles.chatInput}
            />
            <button type="submit" style={styles.chatSend}>↑</button>
          </form>
        </div>

      </div>

      <ToastContainer toasts={toasts} />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}

// ─── Scoreboard overlay ────────────────────────────────────────
interface ClassementEntry { rang: number; username: string; points: number; nombreEssais: number }

function ScoreboardOverlay({
  classement,
  currentUsername,
  onClose,
}: {
  classement: ClassementEntry[]
  currentUsername: string
  onClose: () => void
}) {
  const MEDALS = ['🥇', '🥈', '🥉']
  const winner = classement[0]
  const isWinner = winner?.username === currentUsername

  return (
    <div style={overlayStyles.backdrop}>
      <div style={overlayStyles.modal}>
        {/* Confetti-like top bar */}
        <div style={overlayStyles.topBar} />

        <div style={overlayStyles.content}>
          <div style={overlayStyles.trophy}>🏆</div>
          <h2 style={overlayStyles.title}>Partie terminée !</h2>

          {isWinner && (
            <div style={overlayStyles.winnerBanner}>
              🎉 Bravo {currentUsername}, tu as gagné !
            </div>
          )}

          {/* Podium */}
          <div style={overlayStyles.table}>
            <div style={overlayStyles.tableHeader}>
              <span style={{ width: '32px' }}>Rang</span>
              <span style={{ flex: 1 }}>Joueur</span>
              <span style={overlayStyles.colRight}>Essais</span>
              <span style={overlayStyles.colRight}>Points</span>
            </div>

            {classement.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Aucun score disponible
              </div>
            ) : (
              classement.map((entry, i) => {
                const isMe = entry.username === currentUsername
                const isFirst = i === 0
                return (
                  <div
                    key={entry.username}
                    style={{
                      ...overlayStyles.tableRow,
                      background: isMe
                        ? 'rgba(79,142,255,0.10)'
                        : isFirst
                        ? 'rgba(245,200,66,0.07)'
                        : 'transparent',
                      borderLeft: isMe
                        ? '3px solid var(--accent)'
                        : isFirst
                        ? '3px solid var(--gold)'
                        : '3px solid transparent',
                      animationDelay: `${i * 80}ms`,
                    }}
                    className="score-row-enter"
                  >
                    <span style={overlayStyles.rankCell}>
                      {MEDALS[i] ?? `#${entry.rang}`}
                    </span>
                    <span style={{ flex: 1, fontWeight: isMe ? 700 : 500 }}>
                      {entry.username}
                      {isMe && (
                        <span style={overlayStyles.meBadge}>toi</span>
                      )}
                    </span>
                    <span style={overlayStyles.colRight}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {entry.nombreEssais} essai{entry.nombreEssais !== 1 ? 's' : ''}
                      </span>
                    </span>
                    <span style={overlayStyles.colRight}>
                      <span style={{
                        color: isFirst ? 'var(--gold)' : isMe ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: 800,
                        fontSize: '1rem',
                      }}>
                        {entry.points} pts
                      </span>
                    </span>
                  </div>
                )
              })
            )}
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: '1.5rem', width: '100%', fontSize: '1rem', padding: '0.85rem' }}
            onClick={onClose}
          >
            Retour au lobby
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scoreModalIn {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scoreRowIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .score-row-enter {
          animation: scoreRowIn 0.35s ease both;
        }
      `}</style>
    </div>
  )
}

const overlayStyles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '480px',
    overflow: 'hidden',
    animation: 'scoreModalIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
  topBar: {
    height: '4px',
    background: 'linear-gradient(90deg, var(--gold), var(--accent), var(--correct))',
  },
  content: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  trophy: {
    fontSize: '3rem',
    lineHeight: 1,
    marginBottom: '0.5rem',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 900,
    color: 'var(--text-primary)',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  winnerBanner: {
    background: 'rgba(245,200,66,0.12)',
    border: '1px solid rgba(245,200,66,0.35)',
    borderRadius: 'var(--radius-md)',
    padding: '0.6rem 1.25rem',
    color: 'var(--gold)',
    fontWeight: 700,
    fontSize: '0.95rem',
    marginBottom: '1.25rem',
    textAlign: 'center',
  },
  table: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.3rem 0.75rem',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.25rem',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: 'var(--radius-md)',
    transition: 'background 0.2s',
  },
  rankCell: {
    width: '32px',
    fontSize: '1.2rem',
    textAlign: 'center',
    flexShrink: 0,
  },
  colRight: {
    width: '80px',
    textAlign: 'right',
    flexShrink: 0,
  },
  meBadge: {
    marginLeft: '0.4rem',
    background: 'rgba(79,142,255,0.15)',
    color: 'var(--accent)',
    borderRadius: '999px',
    padding: '0.05rem 0.4rem',
    fontSize: '0.7rem',
    fontWeight: 700,
    verticalAlign: 'middle',
  },
}

// ─── Mini keyboard hint component ─────────────────────────────
function KeyboardHint({ grid, longueurMot, input }: {
  grid: Cell[][]
  longueurMot: number
  input: string
}) {
  const ROWS = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN']

  // Build letter state map from played rows
  const letterState: Record<string, CellState> = {}
  grid.forEach(row => {
    row.forEach(cell => {
      if (cell.state !== 'empty') {
        const prev = letterState[cell.letter]
        if (!prev || prev === 'absent' || (prev === 'present' && cell.state === 'correct')) {
          letterState[cell.letter] = cell.state
        }
      }
    })
  })

  return (
    <div style={kbStyles.wrapper}>
      {ROWS.map((row, ri) => (
        <div key={ri} style={kbStyles.row}>
          {row.split('').map(letter => {
            const st = letterState[letter]
            return (
              <div
                key={letter}
                style={{
                  ...kbStyles.key,
                  background: st === 'correct' ? 'var(--correct)'
                    : st === 'present' ? 'var(--present)'
                    : st === 'absent'  ? '#222'
                    : 'var(--bg-elevated)',
                  color: st ? '#fff' : 'var(--text-secondary)',
                  opacity: st === 'absent' ? 0.4 : 1,
                }}
              >
                {letter}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

const kbStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    marginTop: '1rem',
  },
  row: {
    display: 'flex',
    gap: '4px',
  },
  key: {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.72rem',
    fontWeight: 700,
    transition: 'background 0.3s',
  },
}

// ─── Styles ───────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    gap: '1.5rem',
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '1.5rem',
    alignItems: 'flex-start',
    width: '100%',
  },
  gameCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  gameHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roundBadge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.2rem',
  },
  gameTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  firstLetter: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    background: 'var(--correct)',
    color: '#fff',
    borderRadius: '6px',
    fontWeight: 900,
    fontSize: '1.1rem',
  },
  infoBanner: {
    padding: '0.6rem 1rem',
    background: 'var(--bg-card)',
    border: '1px solid',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  tentativeInfo: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  row: {
    display: 'flex',
    gap: '6px',
  },
  cell: {
    width: '56px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    fontWeight: 900,
    borderRadius: '6px',
    textTransform: 'uppercase',
    userSelect: 'none',
    fontFamily: 'var(--font-display)',
    letterSpacing: 0,
    transition: 'background 0.3s',
  },
  inputRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-surface)',
    border: '2px solid var(--accent)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    boxShadow: '0 0 12px var(--accent-glow)',
  },
  prefixLetter: {
    width: '44px',
    height: '44px',
    background: 'var(--correct)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 900,
    fontSize: '1.2rem',
    flexShrink: 0,
  },
  guessInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    padding: '0 0.75rem',
    fontSize: '1.3rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)',
    height: '44px',
  },
  opponentsCard: {
    padding: '1rem',
  },
  opponentsTitle: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.75rem',
  },
  opponentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.4rem 0',
    borderBottom: '1px solid var(--border)',
  },
  opponentAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'var(--bg-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--gold)',
    flexShrink: 0,
  },
  opponentName: {
    flex: 1,
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  opponentDots: {
    display: 'flex',
    gap: '3px',
  },
  opponentDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  leaderboard: {
    borderColor: 'rgba(245,200,66,0.3)',
    background: 'rgba(245,200,66,0.04)',
  },
  leaderboardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    color: 'var(--gold)',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  leaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.4rem 0',
    borderBottom: '1px solid var(--border)',
  },
  leaderRank: {
    fontWeight: 900,
    color: 'var(--text-muted)',
    width: '30px',
  },
  leaderUser: {
    flex: 1,
    fontWeight: 600,
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
    maxHeight: 'calc(100vh - 80px)',
    position: 'sticky',
    top: '70px',
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
    minHeight: '300px',
  },
  chatMsg: {
    fontSize: '0.88rem',
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  chatForm: {
    display: 'flex',
    borderTop: '1px solid var(--border)',
    padding: '0.5rem 0.75rem',
    gap: '0.5rem',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
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
    fontFamily: 'var(--font-body)',
  },
}