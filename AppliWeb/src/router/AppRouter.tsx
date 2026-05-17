import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import LobbyPage from '../pages/LobbyPage'
import GamePage from '../pages/GamePage'
import LeaderboardPage from '../pages/LeaderboardPage'
import HistoryPage from '../pages/HistoryPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages sans navbar (auth) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Pages protégées (nécessitent d'être connecté) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<LobbyPage />} />
            <Route path="/game/:id" element={<GamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
