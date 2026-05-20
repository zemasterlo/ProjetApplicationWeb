

import React, { createContext, useContext, useState, useCallback } from 'react'
import type { User } from '../services/api'
import { userService } from '../services/api'

interface AuthContextValue {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): User | null {
  try {
    const raw = sessionStorage.getItem('tusmo_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveUser(user: User | null) {
  if (user) {
    sessionStorage.setItem('tusmo_user', JSON.stringify(user))
  } else {
    sessionStorage.removeItem('tusmo_user')
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser)

  const login = useCallback(async (username: string, password: string) => {
    const u = await userService.login(username, password)
    saveUser(u)
    setUser(u)
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const u = await userService.register(username, email, password)
    saveUser(u)
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    if (user) {
      await userService.logout(user.id).catch(() => {})
    }
    saveUser(null)
    setUser(null)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
