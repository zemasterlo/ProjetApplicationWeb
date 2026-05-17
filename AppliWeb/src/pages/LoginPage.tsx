import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// --- MODIFICATION : Ajout de l'import userService depuis api.ts ---
import { userService } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await userService.login(username, password);
      
      console.log('Login réussi');

      if (response && response.id) {
        localStorage.setItem('userId', response.id.toString());
        localStorage.setItem('username', response.username);
      }
      
      navigate('/');
    } catch (error) {
       console.error("Identifiants invalides ou erreur API", error);
    }
  }

  return (
    <div>
      <div>
        <h1>TUSMO</h1>
        <h2>Connexion</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Pseudo</label>
            <input
              
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ton pseudo"
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
            Se connecter
          </button>
        </form>

        <p>
          Pas encore de compte ?{' '}
          <Link to="/register">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}
