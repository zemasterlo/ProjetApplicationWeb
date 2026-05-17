import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { guessService, messageService, roomService, gameService } from '../services/api'
import { wsService } from '../services/websocket'

type CellState = 'correct' | 'present' | 'absent' | 'empty'

interface Cell {
  letter: string
  state: CellState
}

interface ChatMessage {
  id: number
  author: string
  text: string
}

interface OpponentInfo {
  username: string
  tentatives: number
  aGagne: boolean
}

const MAX_TENTATIVES = 6

const cellColors: Record<CellState, string> = {
  correct: '#6aaa64',
  present: '#c9b458',
  absent: '#787c7e',
  empty: '#fff',
}

// Convertir le résultat backend "C,P,A,A,C" en cellules pour la grille
function parseResultat(mot: string, resultat: string): Cell[] {
  const lettres = mot.split('')
  const etats = resultat.split(',')
  return lettres.map((letter, i) => ({
    letter,
    state: etats[i] === 'C' ? 'correct' : etats[i] === 'P' ? 'present' : 'absent',
  }))
}

// Créer une grille vierge de MAX_TENTATIVES x wordLength
function createEmptyGrid(wordLength: number, firstLetter: string): Cell[][] {
  const newGrid: Cell[][] = []
  for (let r = 0; r < MAX_TENTATIVES; r++) {
    const row: Cell[] = []
    for (let c = 0; c < wordLength; c++) {
      row.push({
        letter: c === 0 ? firstLetter.toUpperCase() : '',
        state: 'empty',
      })
    }
    newGrid.push(row)
  }
  return newGrid
}

export default function GamePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const roomId = Number(id)
  const userId = Number(localStorage.getItem('userId'))
  const username = localStorage.getItem('username') || 'Moi'

  // État du round
  const [roundId, setRoundId] = useState<number | null>(null)
  const [premiereLettre, setPremiereLettre] = useState('')
  const [longueurMot, setLongueurMot] = useState(5)
  const [numeroRound, setNumeroRound] = useState(1)
  const [nombreRoundsTotal, setNombreRoundsTotal] = useState(3)

  // Grille de jeu
  const [grid, setGrid] = useState<Cell[][]>([])
  const [tentativeNum, setTentativeNum] = useState(0)
  const [roundWon, setRoundWon] = useState(false)
  const [roundLost, setRoundLost] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [roomCode, setRoomCode] = useState('')

  // Input
  const [input, setInput] = useState('')

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Adversaires
  const [opponents, setOpponents] = useState<OpponentInfo[]>([])

  // Message d'info
  const [infoMessage, setInfoMessage] = useState('')

  // Partie démarrée ?
  const [gameStarted, setGameStarted] = useState(false)

  // Ref pour le callback WS (éviter les closures stale)
  const wsCallbackRef = useRef<(msg: any) => void>(() => {})

  // ─────────────── WebSocket handler ───────────────
  // On met à jour la ref à chaque render pour avoir accès aux derniers states
  wsCallbackRef.current = (msg: any) => {
    switch (msg.type) {
      case 'PLAYER_JOINED':
        setInfoMessage(`${msg.data.username} a rejoint la salle`)
        break

      case 'PLAYER_LEFT':
        setInfoMessage(`${msg.data.username} a quitté la salle`)
        break

      case 'GAME_STARTED': {
        const len = Number(msg.data.longueurMot)
        const letter = String(msg.data.premiereLettre)
        setGameStarted(true)
        setRoundId(Number(msg.data.roundId))
        setPremiereLettre(letter)
        setLongueurMot(len)
        setNumeroRound(Number(msg.data.numeroRound))
        setGrid(createEmptyGrid(len, letter))
        setRoundWon(false)
        setRoundLost(false)
        setGameFinished(false)
        setTentativeNum(0)
        setInput('')
        setOpponents([])
        setInfoMessage('La partie commence !')
        break
      }

      case 'GUESS_MADE':
        if (msg.data.username !== username) {
          setOpponents(prev => {
            const existing = prev.find((o: OpponentInfo) => o.username === msg.data.username)
            if (existing) {
              return prev.map((o: OpponentInfo) =>
                o.username === msg.data.username
                  ? { ...o, tentatives: Number(msg.data.numeroEssai), aGagne: Boolean(msg.data.estCorrect) }
                  : o
              )
            } else {
              return [...prev, {
                username: msg.data.username,
                tentatives: Number(msg.data.numeroEssai),
                aGagne: Boolean(msg.data.estCorrect),
              }]
            }
          })
        }
        break

      case 'ROUND_ENDED':
        setInfoMessage(`Round ${msg.data.numeroRound} terminé ! Le mot était : ${msg.data.motCorrect}`)
        break

      case 'NEW_ROUND': {
        const len = Number(msg.data.longueurMot)
        const letter = String(msg.data.premiereLettre)
        setRoundId(Number(msg.data.roundId))
        setPremiereLettre(letter)
        setLongueurMot(len)
        setNumeroRound(Number(msg.data.numeroRound))
        setGrid(createEmptyGrid(len, letter))
        setRoundWon(false)
        setRoundLost(false)
        setTentativeNum(0)
        setInput('')
        setOpponents([])
        setInfoMessage(`Round ${msg.data.numeroRound} commence !`)
        break
      }

      case 'GAME_ENDED':
        setGameFinished(true)
        setGameStarted(false)
        setInfoMessage('Partie terminée ! 🏆')
        break

      case 'NEW_MESSAGE':
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          author: msg.data.username,
          text: msg.data.contenu,
        }])
        break
    }
  }

  // ─────────────── Initialisation ───────────────
  useEffect(() => {
    if (!id || isNaN(roomId) || !userId) {
      navigate('/')
      return
    }

    async function init() {
      try {
        // 1. Charger les infos de la salle
        const room = await roomService.getRoom(id!)
        if (!room) {
          setInfoMessage('Salle introuvable')
          return
        }
        setRoomCode(room.code)

        // 2. Se connecter au WebSocket via le code de la salle
        wsService.connect(room.code, (msg: any) => wsCallbackRef.current(msg))

        // 3. Charger les messages existants du chat
        try {
          const msgs = await messageService.getRoomMessages(roomId)
          setChatMessages(msgs.map((m: any) => ({
            id: m.id,
            author: m.user?.username || 'Inconnu',
            text: m.contenu,
          })))
        } catch {
          // Pas de messages existants
        }

        // 4. Vérifier s'il y a une partie en cours (reprise après navigation)
        try {
          const state = await gameService.getActiveGameState(roomId, userId)
          if (state && state.roundId) {
            const len = Number(state.longueurMot)
            const letter = String(state.premiereLettre)

            setGameStarted(true)
            setRoundId(Number(state.roundId))
            setPremiereLettre(letter)
            setLongueurMot(len)
            setNumeroRound(Number(state.numeroRound))
            setNombreRoundsTotal(Number(state.nombreRoundsTotal))

            // Reconstruire la grille
            const freshGrid = createEmptyGrid(len, letter)
            const existingGuesses = state.guesses || []

            existingGuesses.forEach((g: any, idx: number) => {
              if (idx < MAX_TENTATIVES) {
                freshGrid[idx] = parseResultat(g.motPropose, g.resultatLettres)
              }
            })

            setGrid(freshGrid)
            setTentativeNum(existingGuesses.length)

            // Vérifier si le joueur a déjà fini
            const alreadyWon = existingGuesses.some((g: any) => g.estCorrect)
            if (alreadyWon) {
              setRoundWon(true)
              setInfoMessage('Tu as déjà trouvé le mot ! 🎉 En attente des autres joueurs...')
            } else if (existingGuesses.length >= MAX_TENTATIVES) {
              setRoundLost(true)
              setInfoMessage('Tu as épuisé tes 6 essais. En attente des autres joueurs...')
            } else {
              setInfoMessage(`Partie reprise — Round ${state.numeroRound}`)
            }
          }
        } catch {
          // Pas de partie en cours, afficher le bouton "Lancer"
        }

      } catch (err) {
        console.error('Erreur initialisation:', err)
        setInfoMessage('Erreur de chargement de la salle.')
      }
    }

    init()

    return () => {
      wsService.disconnect()
    }
  }, [id])

  // ─────────────── Démarrer la partie ───────────────
  async function handleStartGame() {
    try {
      setInfoMessage('Lancement en cours...')
      await gameService.startGame(roomId, nombreRoundsTotal)
      // Le WebSocket GAME_STARTED fera le reste
    } catch (err: any) {
      const msg = err.response?.data || 'Erreur lors du lancement de la partie'
      setInfoMessage(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
  }

  // ─────────────── Soumettre une tentative ───────────────
  async function handleGuess(e: React.FormEvent) {
    e.preventDefault()
    if (!roundId || roundWon || roundLost || gameFinished) return

    const motComplet = input.toUpperCase().trim()

    if (!motComplet) {
      setInfoMessage('Tape un mot avant de valider !')
      return
    }

    if (motComplet.length !== longueurMot) {
      setInfoMessage(`Le mot doit faire exactement ${longueurMot} lettres (tu en as tapé ${motComplet.length}).`)
      return
    }

    try {
      const result = await guessService.faireTentative(roundId, userId, motComplet)

      // Mettre à jour la grille avec le résultat du backend
      const cells = parseResultat(result.motPropose, result.resultatLettres)
      const currentTentative = tentativeNum

      setGrid(prev => {
        const newGrid = prev.map(row => [...row])
        newGrid[currentTentative] = cells
        return newGrid
      })

      const nextTentative = currentTentative + 1
      setTentativeNum(nextTentative)

      if (result.estCorrect) {
        setRoundWon(true)
        setInfoMessage(`Bravo ! Tu as trouvé le mot en ${nextTentative} essai${nextTentative > 1 ? 's' : ''} ! 🎉`)
      } else if (nextTentative >= MAX_TENTATIVES) {
        setRoundLost(true)
        setInfoMessage('Tu as épuisé tes 6 essais... En attente des autres joueurs.')
      } else {
        setInfoMessage('')
      }

      setInput('')
    } catch (err: any) {
      const errorMsg = err.response?.data
      if (typeof errorMsg === 'string') {
        setInfoMessage(errorMsg)
      } else {
        setInfoMessage('Erreur lors de la tentative.')
      }
    }
  }

  // ─────────────── Chat ───────────────
  async function handleChat(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim()) return
    try {
      await messageService.sendMessage(roomId, userId, chatInput.trim())
      setChatInput('')
    } catch (err) {
      console.error('Erreur chat:', err)
    }
  }

  // ─────────────── Quitter la salle ───────────────
  async function handleLeave() {
    try {
      if (roomCode) {
        await roomService.leaveRoom(roomCode, userId)
      }
    } catch (err) {
      // Ignorer les erreurs (salle déjà supprimée, etc.)
    }
    navigate('/')
  }

  // Scroll auto du chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ─────────────── RENDER ───────────────
  return (
    <div style={styles.page}>

      <div style={styles.gameCol}>
        <div style={styles.gameHeader}>
          <h2 style={styles.gameTitle}>
            {gameStarted
              ? `Round ${numeroRound} / ${nombreRoundsTotal}`
              : `Salle — ${roomCode || '...'}`
            }
          </h2>
          <button style={styles.leaveBtn} onClick={handleLeave}>
            Quitter
          </button>
        </div>

        {/* Message d'info */}
        {infoMessage && (
          <p style={styles.info}>{infoMessage}</p>
        )}

        {/* Écran pré-partie : bouton lancer + code salle */}
        {!gameStarted && !gameFinished && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={styles.hint}>
              Code de la salle : <strong>{roomCode}</strong> — Partage ce code pour inviter des joueurs !
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label>Nombre de rounds :</label>
              <select
                value={nombreRoundsTotal}
                onChange={(e) => setNombreRoundsTotal(Number(e.target.value))}
              >
                <option value={1}>1</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
              </select>
            </div>
            <button style={styles.startBtn} onClick={handleStartGame}>
              🚀 Lancer la partie
            </button>
          </div>
        )}

        {/* Écran fin de partie */}
        {gameFinished && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ fontSize: '1.2rem' }}>La partie est terminée !</p>
            <button style={styles.startBtn} onClick={() => {
              setGameFinished(false)
              setGameStarted(false)
              setRoundWon(false)
              setRoundLost(false)
              setTentativeNum(0)
              setGrid([])
              setOpponents([])
              setInfoMessage('Prêt pour une nouvelle partie !')
            }}>
              🔄 Nouvelle partie
            </button>
          </div>
        )}

        {/* Grille Tusmo */}
        {gameStarted && !gameFinished && (
          <>
            <p style={styles.hint}>
              Tentative {Math.min(tentativeNum + 1, MAX_TENTATIVES)} / {MAX_TENTATIVES}
              {' — '}Mot de <strong>{longueurMot}</strong> lettres commençant par <strong>{premiereLettre}</strong>
            </p>

            <div style={styles.grid}>
              {grid.map((row: Cell[], rowIdx: number) => (
                <div key={rowIdx} style={styles.row}>
                  {row.map((cell: Cell, colIdx: number) => (
                    <div
                      key={colIdx}
                      style={{
                        ...styles.cell,
                        background: cellColors[cell.state],
                        color: cell.state === 'empty' ? '#333' : '#fff',
                        border: cell.state === 'empty' ? '2px solid #ccc' : '2px solid transparent',
                      }}
                    >
                      {cell.letter}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Input de tentative — masqué si le joueur a fini */}
            {!roundWon && !roundLost && (
              <form onSubmit={handleGuess} style={styles.inputRow}>
                <input
                  style={styles.guessInput}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  maxLength={longueurMot}
                  placeholder={`Tape un mot de ${longueurMot} lettres...`}
                  autoFocus
                />
                <button style={styles.submitBtn} type="submit">
                  Valider
                </button>
              </form>
            )}
          </>
        )}

        {/* Adversaires */}
        {opponents.length > 0 && (
          <div style={styles.opponents}>
            <h4>Adversaires</h4>
            {opponents.map((op: OpponentInfo) => (
              <div key={op.username} style={styles.opponentRow}>
                <span>{op.username}</span>
                <span style={{ color: op.aGagne ? '#6aaa64' : '#787c7e' }}>
                  {op.aGagne ? '✅ Trouvé !' : `${op.tentatives} / ${MAX_TENTATIVES}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat */}
      <div style={styles.chatCol}>
        <h3 style={styles.chatTitle}>Chat</h3>

        <div style={styles.chatMessages}>
          {chatMessages.map((msg: ChatMessage) => (
            <div key={msg.id} style={styles.chatMsg}>
              <span style={{
                ...styles.chatAuthor,
                color: msg.author === username ? '#1a73e8' : '#e8711a'
              }}>
                {msg.author}{' '}
              </span>
              {msg.text}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleChat} style={styles.chatForm}>
          <input
            style={styles.chatInput}
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Message..."
          />
          <button style={styles.chatSend} type="submit">
            Envoyer
          </button>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  gameCol: {
    flex: 1,
  },
  gameHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  gameTitle: {
    fontSize: '1.5rem',
    margin: 0,
  },
  leaveBtn: {
    padding: '0.4rem 0.9rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: 'transparent',
    cursor: 'pointer',
  },
  startBtn: {
    padding: '0.5rem 1.2rem',
    background: '#34a853',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  hint: {
    color: '#666',
    marginBottom: '1rem',
  },
  info: {
    padding: '0.5rem 1rem',
    background: '#e8f0fe',
    borderRadius: '6px',
    color: '#1a73e8',
    marginBottom: '1rem',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '1.5rem',
  },
  row: {
    display: 'flex',
    gap: '6px',
  },
  cell: {
    width: '54px',
    height: '54px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  inputRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  guessInput: {
    flex: 1,
    padding: '0.6rem 0.75rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1.1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
  },
  submitBtn: {
    padding: '0.6rem 1.2rem',
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  opponents: {
    marginTop: '1.5rem',
    padding: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
  },
  opponentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.3rem 0',
  },
  chatCol: {
    width: '260px',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  chatTitle: {
    margin: 0,
    padding: '0.75rem 1rem',
    background: '#f5f5f5',
    borderBottom: '1px solid #ddd',
    fontSize: '0.95rem',
  },
  chatMessages: {
    flex: 1,
    minHeight: '300px',
    maxHeight: '400px',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    overflowY: 'auto',
  },
  chatMsg: {
    fontSize: '0.9rem',
    color: '#333',
  },
  chatAuthor: {
    fontWeight: 'bold',
  },
  chatForm: {
    display: 'flex',
    borderTop: '1px solid #ddd',
  },
  chatInput: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    border: 'none',
    outline: 'none',
    fontSize: '0.9rem',
  },
  chatSend: {
    padding: '0.5rem 0.75rem',
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
}
