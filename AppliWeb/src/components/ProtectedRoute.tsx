import { Navigate, Outlet } from 'react-router-dom'

/**
 * Composant qui protège les routes internes.
 * Si l'utilisateur n'est pas connecté (pas de userId dans localStorage),
 * il est redirigé vers /login.
 */
export default function ProtectedRoute() {
  const userId = localStorage.getItem('userId')

  if (!userId) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
