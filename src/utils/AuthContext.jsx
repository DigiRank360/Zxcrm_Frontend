/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiRequest } from './api'

const AuthContext = createContext(null)

export const ROLES = { admin: 'Admin', hr: 'HR', employee: 'Employee', technician: 'Technician' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (!localStorage.getItem('crm_token')) return null
    try { return JSON.parse(localStorage.getItem('crm_user') || 'null') } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('crm_token') || '')

  useEffect(() => {
    if (!token) return
    let active = true
    apiRequest('/api/auth/me', { token }).then(({ user: currentUser }) => {
      if (!active || !currentUser) return
      localStorage.setItem('crm_user', JSON.stringify(currentUser))
      setUser(currentUser)
    }).catch(() => {
      if (!active) return
      localStorage.removeItem('crm_user')
      localStorage.removeItem('crm_token')
      setUser(null)
      setToken('')
    })
    return () => { active = false }
  }, [token])

  const login = async (username, password) => {
    const result = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    localStorage.setItem('crm_user', JSON.stringify(result.user))
    localStorage.setItem('crm_token', result.token)
    setUser(result.user)
    setToken(result.token)
  }
  const logout = useCallback(() => {
    localStorage.removeItem('crm_user')
    localStorage.removeItem('crm_token')
    setUser(null)
    setToken('')
  }, [])
  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
