import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userService } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }

    try {
      const newUser = await userService.register(username, email, password);

      if (newUser && newUser.id) {
        localStorage.setItem('userId', newUser.id.toString());
        localStorage.setItem('username', newUser.username);
      }
      
      navigate('/');
    } catch (err: any) {
      if (err.response?.data) {
        setError(err.response.data);
      } else {
        setError("Erreur lors de l'inscription. Réessaye plus tard.");
      }
    }
  }

  return (
    <div>
      <div>
        <h1>TUSMO</h1>
        <h2>Créer un compte</h2>

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

          <button type="submit">
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
