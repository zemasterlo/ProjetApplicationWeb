

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { LobbyPage } from './pages/LobbyPage'
import { RoomPage } from './pages/RoomPage'
import { GamePage } from './pages/GamePage'
import { HistoryPage } from './pages/HistoryPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
      <Route path="/room/:id" element={<ProtectedRoute><RoomPage /></ProtectedRoute>} />
      <Route path="/room/:roomId/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/game/:id" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
