import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// --- MODIFICATION : Importation de userService ---
import { userService } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      // --- MODIFICATION : Appel API au UserController.java ---
      const newUser = await userService.register(username, email, password);
      console.log('Utilisateur créé:', newUser);
      
      // Stocker l'ID localement pour le réutiliser
      if (newUser && newUser.id) {
        localStorage.setItem('userId', newUser.id.toString());
      }
      
      navigate('/');
    } catch (e) {
      console.error("Erreur lors de l'inscription:", e);
    }
  }

  return (
    <div>
      <div>
        <h1>TUSMO</h1>
        <h2>Créer un compte</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Pseudo</label>
            <input
              
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choisis un pseudo"
              required
            />
          </div>

          <div>
            <label>Email</label>
            <input
              
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              required
            />
          </div>

          <div>
            <label>Mot de passe</label>
            <input
              
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button  type="submit">
            S'inscrire
          </button>
        </form>

        <p>
          Déjà un compte ?{' '}
          <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
