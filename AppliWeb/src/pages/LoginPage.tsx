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
      // --- MODIFICATION : Appel à la logique utilisateur backend via userService ---
      // Si un endpoint login existe sur Spring Boot, on fait authService.login.
      // S'il ne l'est pas, on simule l'appel :
      const response = await userService.login({ username, password });
      
      console.log('Login REST successé');

      // Si le backend renvoie des infos, on set l'ID localement
      if (response && response.userId) {
         localStorage.setItem('userId', response.userId.toString());
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
