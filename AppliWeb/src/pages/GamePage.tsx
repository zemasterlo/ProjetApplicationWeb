import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'


const FAKE_GRID = [
  [
    { letter: 'T', state: 'correct' },
    { letter: 'A', state: 'absent' },
    { letter: 'B', state: 'present' },
    { letter: 'L', state: 'absent' },
    { letter: 'E', state: 'correct' },
  ],
  [
    { letter: 'T', state: 'correct' },
    { letter: 'I', state: 'absent' },
    { letter: 'G', state: 'absent' },
    { letter: 'R', state: 'absent' },
    { letter: 'E', state: 'correct' },
  ],
  
  ...Array(4).fill(Array(5).fill({ letter: '', state: 'empty' })),
]

const FAKE_CHAT = [
  { id: 1, author: 'Alice', text: 'Bonne chance !' },
  { id: 2, author: 'Bob', text: 'Gg Alice 👀' },
]

type CellState = 'correct' | 'present' | 'absent' | 'empty'

const cellColors: Record<CellState, string> = {
  correct: '#6aaa64',
  present: '#c9b458',
  absent: '#787c7e',
  empty: '#fff',
}

export default function GamePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [chatInput, setChatInput] = useState('')

  function handleGuess(e: React.FormEvent) {
    e.preventDefault()
    // jsp du tout, web socket ?
    console.log('Tentative:', input)
    setInput('')
  }

  function handleChat(e: React.FormEvent) {
    e.preventDefault()
    // web socket jpense
    console.log('Message chat:', chatInput)
    setChatInput('')
  }

  return (
    <div style={styles.page}>
      
      <div style={styles.gameCol}>
        <div style={styles.gameHeader}>
          <h2 style={styles.gameTitle}>Partie #{id}</h2>
          <button style={styles.leaveBtn} onClick={() => navigate('/')}>
            Quitter
          </button>
        </div>

        <p style={styles.hint}>Tentative 3 / 6 — Mot de 5 lettres</p>

        
        <div style={styles.grid}>
          {FAKE_GRID.map((row, rowIdx) => (
            <div key={rowIdx} style={styles.row}>
              {row.map((cell, colIdx) => (
                <div
                  key={colIdx}
                  style={{
                    ...styles.cell,
                    background: cellColors[cell.state as CellState],
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

       
        <form onSubmit={handleGuess} style={styles.inputRow}>
          <input
            style={styles.guessInput}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            maxLength={5}
            placeholder="Tape un mot..."
          />
          <button style={styles.submitBtn} type="submit">
            Valider
          </button>
        </form>
      </div>

     
      <div style={styles.chatCol}>
        <h3 style={styles.chatTitle}>Chat</h3>

        <div style={styles.chatMessages}>
          {FAKE_CHAT.map((msg) => (
            <div key={msg.id} style={styles.chatMsg}>
              <span style={styles.chatAuthor}>{msg.author} </span>
              {msg.text}
            </div>
          ))}
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
  hint: {
    color: '#666',
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
    color: '#1a73e8',
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
