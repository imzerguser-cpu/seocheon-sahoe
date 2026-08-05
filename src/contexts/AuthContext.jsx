import { createContext, useContext, useState, useCallback } from 'react'
import { getSession, saveSession, clearSession } from '../lib/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession())

  const login = useCallback((role) => {
    saveSession(role)
    setSession(getSession())
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
