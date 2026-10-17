/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import { agents, workers } from '../data/mockData'

const AuthContext = createContext(null)

export const ROLES = { admin: 'Admin', employee: 'Employee', technician: 'Technician' }

const creds = {
  admin: { 0: ['admin', 'Admin@123'] },
  employee: { 1: ['rahul', 'Rahul@123'], 2: ['priya', 'Priya@123'], 3: ['amit', 'Amit@123'], 4: ['neha', 'Neha@123'] },
  technician: { 11: ['suresh', 'Suresh@123'], 12: ['mohit', 'Mohit@123'] },
}

export const accounts = [
  { id: 0, name: 'Admin', role: 'admin' },
  ...agents.map((a) => ({ id: a.id, name: a.name, role: 'employee' })),
  ...workers.map((w) => ({ id: w.id, name: w.name, role: 'technician' })),
].map((u) => ({ ...u, username: creds[u.role][u.id][0], password: creds[u.role][u.id][1] }))

export function authenticate(username, password) {
  const acc = accounts.find((a) => a.username === username.trim().toLowerCase() && a.password === password)
  if (!acc) return null
  return { id: acc.id, name: acc.name, role: acc.role }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('crm_user') || 'null'))
  const login = (u) => { localStorage.setItem('crm_user', JSON.stringify(u)); setUser(u) }
  const logout = () => { localStorage.removeItem('crm_user'); setUser(null) }
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
