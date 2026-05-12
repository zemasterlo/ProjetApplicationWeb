import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// --- MODIFICATION : Importation du guessService, messageService pour le chat ---
import { guessService, messageService } from '../services/api';
import { wsService } from '../services/websocket';

type CellState = 'correct' | 'present' | 'absent' | 'empty';

const cellColors: Record<CellState, string> = {
  correct: '#6aaa64',
  present: '#c9b458',
  absent: '#787c7e',
  empty: '#fff',
};

// Grille par défaut
const EMPY_GRID = Array(6).fill(Array(5).fill({ letter: '', state: 'empty' }));

export default function GamePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  
  const [grid, setGrid] = useState(EMPY_GRID);
  const [chatMessages, setChatMessages] = useState<{id?: number, contenu: string, userId?: number}[]>([]);

  // TODO: Prendre l'ID du User connecté via un contexte ou localStorage
  const currentUserId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId') as string) : 1;

  useEffect(() => {
    if (id) {
      // --- MODIFICATION : Récupération des historiques de requêtes et de messages ---
      guessService.getGuessesByRound(Number(id))
        .then(data => {
            console.log("Guesses de l'API:", data);
            // On peut mapper les guesses ici si l'API retourne le détail
        })
        .catch(err => console.error("Erreur REST Guesses:", err));

      messageService.getRoomMessages(Number(id))
        .then(data => {
            setChatMessages(data);
        })
        .catch(err => console.error("Erreur REST Chat:", err));
        
      // --- MODIFICATION : Branchement WebSocket réel ---
      wsService.connect(id, (incomingMessage) => {
        // En fonction du type de retour Spring Boot, on ajoute à la liste
        setChatMessages((prev) => [...prev, incomingMessage]);
      });
    }

    return () => wsService.disconnect();
  }, [id]);

  async function handleGuess(e: React.FormEvent) {
    e.preventDefault();
    if (!id || input.length < 5) return;
    
    try {
      // --- MODIFICATION : Appel de l'API de tentative du GuessController ---
      const newGuess = await guessService.faireTentative(Number(id), currentUserId, input);
      console.log('Réponse de Spring Boot:', newGuess);
      
      // Mettre à jour l'affichage de la grille ici si le backend retourne l'état détaillé
      // (Pour l'instant, on laisse l'affichage abstrait)
      
    } catch (error) {
      console.error("Tentative échouée", error);
    }
    
    setInput('');
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !chatInput.trim()) return;

    try {
      // --- MODIFICATION : Appel de l'API messageService pour persister et broadcaster le chat ---
      await messageService.sendMessage(Number(id), currentUserId, chatInput);
      console.log("Message envoyé REST");
      
      // Ou utilisation du WebSocket direct (selon l'architecture Spring Boot)
      // wsService.sendMessage(id, { userId: currentUserId, contenu: chatInput });
    } catch (err) {
      console.error("Erreur chat:", err);
    }
    
    setChatInput('');
  }

  return (
    <div>
      
      {/* JEU */}
      <div>
        <div>
          <h2>Partie #{id}</h2>
          <button 
            
            onClick={() => navigate('/')}>
            Quitter
          </button>
        </div>

        <p>Mot de 5 lettres</p>

        <div>
          {grid.map((row, rowIdx) => (
            <div key={rowIdx}>
              {row.map((cell: any, colIdx: number) => (
                <div
                  key={colIdx}
                  
                  style={{
                    backgroundColor: cellColors[cell.state as CellState],
                    color: cell.state === 'empty' ? '#333' : '#fff',
                    border: cell.state === 'empty' ? '2px solid #ccc' : '2px solid transparent',
                  }}>
                  {cell.letter}
                </div>
              ))}
            </div>
          ))}
        </div>

        <form onSubmit={handleGuess}>
          <input
            
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            maxLength={5}
            placeholder="Tape un mot..."
          />
          <button  type="submit">
            Valider
          </button>
        </form>
      </div>

      {/* CHAT */}
      <div>
        <h3>Chat</h3>

        <div>
          {chatMessages.length === 0 && <p>Aucun message</p>}
          {chatMessages.map((msg, i) => (
            <div key={i}>
              <span>User {msg.userId} </span>
              <span>{msg.contenu}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleChat}>
          <input
            
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Message..."
          />
          <button  type="submit">
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
