import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { apiRequest } from './api'
import { useAuth } from './AuthContext'

const CrmContext = createContext(null)

export function CrmProvider({ children }) {
  const { user, token } = useAuth()
  const [leads, setLeadsState] = useState([])
  const [attendance, setAttendanceState] = useState([])
  const [installations, setInstallationsState] = useState([])
  const [maintenance, setMaintenanceState] = useState([])
  const [applications, setApplicationsState] = useState([])
  const [users, setUsers] = useState([])
  const [loadedToken, setLoadedToken] = useState('')
  const [error, setError] = useState('')
  const stateRef = useRef({
    leads: [],
    attendance: [],
    installations: [],
    maintenance: [],
    applications: [],
  })
  const writeQueues = useRef({})
  const loading = Boolean(user && token && loadedToken !== token)

  useEffect(() => {
    if (!user || !token) return
    let active = true
    apiRequest('/api/crm', { token })
      .then((data) => {
        if (!active) return
        stateRef.current = data
        setLeadsState(data.leads)
        setAttendanceState(data.attendance)
        setInstallationsState(data.installations)
        setMaintenanceState(data.maintenance)
        setApplicationsState(data.applications || [])
        setUsers(data.users || [])
        stateRef.current = { ...stateRef.current, applications: data.applications || [] }
        setError('')
      })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoadedToken(token) })
    return () => { active = false }
  }, [user, token])

  const updateResource = (resource, setState, update) => {
    const current = stateRef.current[resource]
    const next = typeof update === 'function' ? update(current) : update
    stateRef.current = { ...stateRef.current, [resource]: next }
    setState(next)
    const previous = writeQueues.current[resource] || Promise.resolve()
    const write = previous.catch(() => {}).then(() => apiRequest(`/api/crm/${resource}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(next),
    }))
    writeQueues.current[resource] = write
    write.catch((err) => setError(err.message))
    setError('')
  }

  const setLeads = (update) => updateResource('leads', setLeadsState, update)
  const setAttendance = (update) => updateResource('attendance', setAttendanceState, update)
  const setInstallations = (update) => updateResource('installations', setInstallationsState, update)
  const setMaintenance = (update) => updateResource('maintenance', setMaintenanceState, update)
  const setMaintenanceLocal = (update) => {
    const next = typeof update === 'function' ? update(stateRef.current.maintenance) : update
    stateRef.current = { ...stateRef.current, maintenance: next }
    setMaintenanceState(next)
  }

  const addInstallation = async (installation) => {
    const result = await apiRequest('/api/installations', {
      method: 'POST',
      token,
      body: JSON.stringify(installation),
    })
    setInstallations((current) => [...current, result.installation])
    setMaintenance((current) => [...current, ...result.maintenance])
  }

  const addApplication = async (application) => {
    const result = await apiRequest('/api/applications', {
      method: 'POST',
      token,
      body: JSON.stringify(application),
    })
    setApplicationsState((current) => [result, ...current])
    stateRef.current = { ...stateRef.current, applications: [result, ...stateRef.current.applications] }
    return result
  }

  const completeApplicationStep = async (id) => {
    const updated = await apiRequest(`/api/applications/${id}/complete-step`, { method: 'POST', token })
    setApplicationsState((current) => current.map((item) => item.id === id ? updated : item))
    stateRef.current = {
      ...stateRef.current,
      applications: stateRef.current.applications.map((item) => item.id === id ? updated : item),
    }
  }

  const addUser = async (user) => {
    const created = await apiRequest('/api/users', {
      method: 'POST',
      token,
      body: JSON.stringify(user),
    })
    setUsers((current) => [...current, created])
    return created
  }

  const autoAssignLeads = async () => {
    try {
      const updated = await apiRequest('/api/leads/auto-assign', { method: 'POST', token })
      stateRef.current = { ...stateRef.current, leads: updated }
      setLeadsState(updated)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const agents = users.filter((user) => user.role === 'employee')
  const workers = users.filter((user) => user.role === 'technician')
  const value = {
    agents, workers, leads, setLeads, attendance, setAttendance, installations, setInstallations,
    addInstallation, maintenance, setMaintenance, setMaintenanceLocal, applications,
    addApplication, completeApplicationStep, users, addUser, autoAssignLeads, loading, error,
  }
  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCrm = () => useContext(CrmContext)
