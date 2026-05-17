import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userService } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const response = await userService.login(username, password);

      if (response && response.id) {
        localStorage.setItem('userId', response.id.toString());
        localStorage.setItem('username', response.username);
      }
      
      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Pseudo ou mot de passe incorrect.');
      } else {
        setError('Erreur de connexion au serveur. Réessaye plus tard.');
      }
    }
  }

  return (
    <div>
      <div>
        <h1>TUSMO</h1>
        <h2>Connexion</h2>

        {error && (
          <p style={{ color: '#d93025', background: '#fce8e6', padding: '0.5rem 1rem', borderRadius: '6px' }}>
            {error}
          </p>
        )}

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

          <button type="submit">
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
