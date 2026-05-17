import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../services/api';

export default function LobbyPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);

  // Formulaire de création de salle
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [maxJoueurs, setMaxJoueurs] = useState(4);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    roomService.getWaitingRooms()
      .then(data => setRooms(data))
      .catch(err => console.error("Erreur récupération rooms:", err));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const currentUserId = Number(localStorage.getItem('userId'));
      const newRoom = await roomService.createRoom(roomName || 'Partie de ' + localStorage.getItem('username'), currentUserId, maxJoueurs);
      navigate(`/game/${newRoom.id}`);
    } catch (err) {
      console.error("Erreur création:", err);
    }
  }

  async function handleJoinByCode(e: React.FormEvent) {
    e.preventDefault();
    try {
      const currentUserId = Number(localStorage.getItem('userId'));
      const room = await roomService.joinRoom(joinCode, currentUserId);
      navigate(`/game/${room.id}`);
    } catch (err) {
      console.error("Erreur join par code:", err);
    }
  }

  async function handleJoin(id: number, code: string) {
    try {
      const currentUserId = Number(localStorage.getItem('userId'));
      await roomService.joinRoom(code, currentUserId);
      navigate(`/game/${id}`);
    } catch (err) {
      console.error("Erreur join:", err);
    }
  }

  return (
    <div>
      <div>
        <h1>Lobby</h1>
        <button onClick={() => setShowCreateForm(!showCreateForm)}>
          + Créer une partie
        </button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <form onSubmit={handleCreate} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Créer une salle</h3>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Nom de la salle : </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Ma super partie"
            />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Joueurs max : </label>
            <select value={maxJoueurs} onChange={(e) => setMaxJoueurs(Number(e.target.value))}>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
            </select>
          </div>
          <button type="submit">Créer</button>
        </form>
      )}

      {/* Rejoindre par code */}
      <form onSubmit={handleJoinByCode} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Code de la salle (ex: ABC123)"
          maxLength={6}
        />
        <button type="submit">Rejoindre par code</button>
      </form>

      <p>Ou rejoins une partie existante :</p>

      <div>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Joueurs</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 && (
              <tr><td colSpan={3}>Aucune partie en attente</td></tr>
            )}
            {rooms.map((room) => (
              <tr key={room.id}>
                <td>{room.nom || 'Sans nom'}</td>
                <td>{room.players?.length || 0} / {room.maxJoueurs}</td>
                <td>
                  <button onClick={() => handleJoin(room.id, room.code)}>
                    Rejoindre
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

