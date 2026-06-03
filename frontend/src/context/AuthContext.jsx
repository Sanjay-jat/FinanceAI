import { createContext, useContext, useState, useEffect } from 'react'
import API from '../api/axios'

const AuthContext = createContext()

const getStoredToken = () => {
  try {
    return localStorage.getItem('token') || null
  } catch {
    return null
  }
}

const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

const isTokenExpired = (token) => {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return true
  return decoded.exp * 1000 < Date.now()
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Validate token on mount
  useEffect(() => {
    const stored = getStoredToken()

    if (!stored) {
      setIsLoading(false)
      return
    }

    if (isTokenExpired(stored)) {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      setIsLoading(false)
      return
    }

    const decoded = decodeToken(stored)
    setToken(stored)
    setUser({ email: decoded?.sub || null })
    setIsLoading(false)
  }, [])

  // Listen for 401s from axios interceptor
  useEffect(() => {
    const handleForceLogout = () => {
      setToken(null)
      setUser(null)
    }
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [])

  const login = (newToken) => {
    localStorage.setItem('token', newToken)
    const decoded = decodeToken(newToken)
    setToken(newToken)
    setUser({ email: decoded?.sub || null })
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}