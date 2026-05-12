import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// --- MODIFICATION : Importation du roomService depuis api.ts ---
import { roomService } from '../services/api';

export default function LobbyPage() {
  const navigate = useNavigate();
  // --- MODIFICATION : Ajout de state pour stocker les rooms récupérées du back ---
  const [rooms, setRooms] = useState<any[]>([]);

  // --- MODIFICATION : useEffect pour fetch les rooms en attente ---
  useEffect(() => {
    roomService.getWaitingRooms()
      .then(data => setRooms(data))
      .catch(err => console.error("Erreur récupération rooms:", err));
  }, []);

  async function handleCreate() {
    // --- MODIFICATION : Appel API pour créer une room ---
    try {
      const currentUserId = 1; // Remplacer par l'ID réel depuis le context d'auth
      const newRoom = await roomService.createRoom("Nouvelle Partie", currentUserId, 4);
      navigate(`/game/${newRoom.id}`); // On navigue vers l'ID nouvellement créé
    } catch (err) {
      console.error("Erreur création:", err);
    }
  }

  async function handleJoin(id: number) {
    // --- MODIFICATION : Appel API pour rejoindre une room ---
    try {
      const currentUserId = 1; // Remplacer par l'ID réel
      await roomService.joinRoom(id.toString(), currentUserId);
      navigate(`/game/${id}`);
    } catch (err) {
      console.error("Erreur join:", err);
    }
  }

  return (
    <div>
      <div>
        <h1>Lobby</h1>
        <button 
          
          onClick={handleCreate}>
          + Créer une partie
        </button>
      </div>

      <p>Rejoins une partie existante ou crée la tienne.</p>

      <div>
        <table>
          <thead>
            <tr>
              <th>ID Room</th>
              <th>Nom</th>
              <th>Joueurs max</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {/* --- MODIFICATION : Mapping des vraies rooms reçue par le backend --- */}
            {rooms.length === 0 && (
              <tr><td colSpan={4}>Aucune partie en attente</td></tr>
            )}
            {rooms.map((room) => (
              <tr key={room.id}>
                <td>{room.id}</td>
                <td>{room.nom || 'Sans nom'}</td>
                <td>{room.maxJoueurs}</td>
                <td>
                  <button 
                    onClick={() => handleJoin(room.id)}>
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
