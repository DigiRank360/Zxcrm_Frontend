import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { apiRequest } from './api'
import { useAuth } from './AuthContext'
import { istDate, istTime } from './helpers'
import { documentToDataUrl, fileToDataUrl } from './uploads'

const CrmContext = createContext(null)

export function CrmProvider({ children }) {
  const { user, token, logout } = useAuth()
  const [leads, setLeadsState] = useState([])
  const [attendance, setAttendanceState] = useState([])
  const [installations, setInstallationsState] = useState([])
  const [maintenance, setMaintenanceState] = useState([])
  const [applications, setApplicationsState] = useState([])
  const [customers, setCustomers] = useState([])
  const [users, setUsers] = useState([])
  const [agents, setAgents] = useState([])
  const [visits, setVisits] = useState([])
  const [holidays, setHolidays] = useState([])
  const [loadedToken, setLoadedToken] = useState('')
  const [error, setError] = useState('')
  const stateRef = useRef({
    leads: [],
    attendance: [],
    installations: [],
    maintenance: [],
    applications: [],
    customers: [],
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
        setCustomers(data.customers || [])
        setUsers(data.users || [])
        setAgents(data.agents || (data.users || []).filter((item) => item.role === 'employee' && item.active !== false))
        setVisits(data.visits || [])
        setHolidays(data.holidays || [])
        stateRef.current = { ...stateRef.current, applications: data.applications || [] }
        setError('')
      })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoadedToken(token) })
    return () => { active = false }
  }, [user, token])

  const updateResource = useCallback((resource, setState, update) => {
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
  }, [token])

  const refreshLeads = useCallback(async () => {
    const data = await apiRequest('/api/crm', { token })
    const currentLeads = data.leads || []
    stateRef.current = { ...stateRef.current, leads: currentLeads }
    setLeadsState(currentLeads)
    return currentLeads
  }, [token])

  const setLeads = (update) => updateResource('leads', setLeadsState, update)
  const setAttendance = useCallback((update) => updateResource('attendance', setAttendanceState, update), [updateResource])
  useEffect(() => {
    if (!user || user.role !== 'employee' || !token) return undefined

    const cutoff = new Date(`${istDate()}T20:30:00+05:30`)
    const cutoffAt = cutoff.getTime()
    const timer = window.setTimeout(() => {
      const today = istDate(cutoff)
      const row = stateRef.current.attendance.find((item) =>
        (item.userId ? item.userId === user.id : item.employee === user.name) &&
        item.date === today &&
        item.checkIn &&
        !item.checkOut
      )

      if (row) {
        const checkInAt = row.checkInAt
          ? new Date(row.checkInAt).getTime()
          : new Date(`${row.date}T${row.checkIn}:00+05:30`).getTime()
        const checkOutAt = new Date(Math.max(cutoffAt, checkInAt))
        setAttendance((current) => current.map((item) => item.id === row.id
          ? { ...item, checkOut: istTime(checkOutAt), checkOutAt: checkOutAt.toISOString() }
          : item))
      }

      logout()
    }, Math.max(0, cutoffAt - Date.now()))

    return () => window.clearTimeout(timer)
  }, [logout, setAttendance, token, user])
  const setInstallationsLocal = (update) => {
    const next = typeof update === 'function' ? update(stateRef.current.installations) : update
    stateRef.current = { ...stateRef.current, installations: next }
    setInstallationsState(next)
  }
  const setMaintenance = (update) => updateResource('maintenance', setMaintenanceState, update)
  const setMaintenanceLocal = (update) => {
    const next = typeof update === 'function' ? update(stateRef.current.maintenance) : update
    stateRef.current = { ...stateRef.current, maintenance: next }
    setMaintenanceState(next)
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
    if (updated.commissionedInstallation) {
      setInstallationsLocal((current) => current.some((item) => item.id === updated.commissionedInstallation.id)
        ? current
        : [...current, updated.commissionedInstallation])
      setMaintenanceLocal((current) => [
        ...current,
        ...(updated.commissionedTickets || []).filter((ticket) => !current.some((item) => item.id === ticket.id)),
      ])
    }
    stateRef.current = {
      ...stateRef.current,
      applications: stateRef.current.applications.map((item) => item.id === id ? updated : item),
    }
  }

  const decideApplicationApproval = async (id, decision, note = '') => {
    const updated = await apiRequest(`/api/applications/${id}/approval`, {
      method: 'POST', token, body: JSON.stringify({ decision, note }),
    })
    setApplicationsState((current) => current.map((item) => item.id === id ? updated : item))
    stateRef.current = { ...stateRef.current, applications: stateRef.current.applications.map((item) => item.id === id ? updated : item) }
  }

  const replaceApplication = (updated) => {
    setApplicationsState((current) => current.map((item) => item.id === updated.id ? updated : item))
    stateRef.current = { ...stateRef.current, applications: stateRef.current.applications.map((item) => item.id === updated.id ? updated : item) }
  }

  const updateApplicationCommercial = async (id, details) => {
    const updated = await apiRequest(`/api/applications/${id}/commercial`, {
      method: 'PATCH', token, body: JSON.stringify(details),
    })
    replaceApplication(updated)
    return updated
  }

  const uploadApplicationOcr = async (id, file) => {
    const document = await documentToDataUrl(file)
    const updated = await apiRequest(`/api/applications/${id}/ocr-document`, {
      method: 'POST', token, body: JSON.stringify({ document, fileName: file.name }),
    })
    replaceApplication(updated)
    return updated
  }

  const assignInstallation = async (id, employeeId) => {
    const result = await apiRequest(`/api/installations/${id}/assign`, {
      method: 'PATCH', token, body: JSON.stringify({ employeeId: employeeId || null }),
    })
    setInstallationsState((current) => current.map((item) => item.id === id ? result.installation : item))
    stateRef.current = {
      ...stateRef.current,
      installations: stateRef.current.installations.map((item) => item.id === id ? result.installation : item),
    }
    if (result.application) {
      setApplicationsState((current) => current.map((item) => item.id === result.application.id ? result.application : item))
      stateRef.current = {
        ...stateRef.current,
        applications: stateRef.current.applications.map((item) => item.id === result.application.id ? result.application : item),
      }
    }
    return result.installation
  }

  const addTicket = async (ticket) => {
    const result = await apiRequest('/api/maintenance', { method: 'POST', token, body: JSON.stringify(ticket) })
    setMaintenanceLocal((current) => [...current, result.ticket])
    return result.ticket
  }

  const uploadPhoto = async (file, context) => {
    const image = await fileToDataUrl(file)
    const result = await apiRequest('/api/uploads', {
      method: 'POST', token, body: JSON.stringify({ image, context }),
    })
    return result.url
  }

  const addVisit = async (visit) => {
    const created = await apiRequest('/api/visits', {
      method: 'POST', token, body: JSON.stringify(visit),
    })
    setVisits((current) => [created, ...current])
    return created
  }

  const addHoliday = async (holiday) => {
    const created = await apiRequest('/api/holidays', {
      method: 'POST', token, body: JSON.stringify(holiday),
    })
    setHolidays((current) => [...current, created].sort((a, b) => a.date.localeCompare(b.date)))
    return created
  }

  const removeHoliday = async (id) => {
    await apiRequest(`/api/holidays/${id}`, { method: 'DELETE', token })
    setHolidays((current) => current.filter((item) => item.id !== id))
  }

  const assignTicket = async (id, workerId) => {
    const result = await apiRequest(`/api/maintenance/${id}`, {
      method: 'PATCH', token, body: JSON.stringify({ workerId: workerId || null }),
    })
    setMaintenanceLocal((current) => current.map((item) => item.id === id ? result.ticket : item))
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

  const updateAgentRouting = async (id, updates) => {
    const updated = await apiRequest(`/api/users/${id}/routing`, {
      method: 'PATCH', token, body: JSON.stringify(updates),
    })
    setUsers((current) => current.map((item) => item.id === id ? updated : item))
    return updated
  }

  const updateUserProfile = async (id, updates) => {
    const updated = await apiRequest(`/api/users/${id}`, {
      method: 'PATCH', token, body: JSON.stringify(updates),
    })
    setUsers((current) => current.map((item) => item.id === id ? updated : item))
    return updated
  }

  const softDeleteUser = async (id) => {
    const deleted = await apiRequest(`/api/users/${id}`, { method: 'DELETE', token })
    setUsers((current) => current.map((item) => item.id === id ? deleted : item))
    return deleted
  }

  const restoreUser = async (id) => {
    const restored = await apiRequest(`/api/users/${id}/restore`, { method: 'POST', token })
    setUsers((current) => current.map((item) => item.id === id ? restored : item))
    return restored
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

  const assignLead = async (id, agentId) => {
    const result = await apiRequest(`/api/leads/${id}/assign`, {
      method: 'PATCH', token, body: JSON.stringify({ agentId: agentId || null }),
    })
    setLeadsState((current) => current.map((lead) => lead.id === id ? result.lead : lead))
    stateRef.current = { ...stateRef.current, leads: stateRef.current.leads.map((lead) => lead.id === id ? result.lead : lead) }
    return result.lead
  }

  const transferLeadLocation = async (id, destination) => {
    const result = await apiRequest(`/api/leads/${id}/transfer-location`, {
      method: 'PATCH', token, body: JSON.stringify(destination),
    })
    setLeadsState((current) => current.map((lead) => lead.id === id ? result.lead : lead))
    stateRef.current = { ...stateRef.current, leads: stateRef.current.leads.map((lead) => lead.id === id ? result.lead : lead) }
    return result.lead
  }

  const updateLead = async (id, updates) => {
    const updated = await apiRequest(`/api/leads/${id}`, {
      method: 'PATCH', token, body: JSON.stringify(updates),
    })
    setLeadsState((current) => current.map((lead) => lead.id === id ? updated : lead))
    stateRef.current = { ...stateRef.current, leads: stateRef.current.leads.map((lead) => lead.id === id ? updated : lead) }
    return updated
  }

  const importLeads = async (items) => {
    const result = await apiRequest('/api/leads/import', {
      method: 'POST', token, body: JSON.stringify(items),
    })
    setLeadsState((current) => [...current, ...result.leads])
    stateRef.current = { ...stateRef.current, leads: [...stateRef.current.leads, ...result.leads] }
    return result
  }

  const createManualLead = async (lead) => {
    const result = await apiRequest('/api/leads/manual', {
      method: 'POST', token, body: JSON.stringify(lead),
    })
    const updatedLeads = [...stateRef.current.leads, result.lead]
    stateRef.current = { ...stateRef.current, leads: updatedLeads }
    setLeadsState(updatedLeads)
    return result.lead
  }

  const workers = users.filter((user) => user.role === 'technician' && user.active !== false)
  const value = {
    agents, workers, leads, setLeads, attendance, setAttendance, installations,
    maintenance, setMaintenance, setMaintenanceLocal, addTicket, assignTicket,
    applications, addApplication, completeApplicationStep, decideApplicationApproval, updateApplicationCommercial, uploadApplicationOcr, assignInstallation, customers,
    users, addUser, updateAgentRouting, updateUserProfile, softDeleteUser, restoreUser,
    visits, addVisit, uploadPhoto, holidays, addHoliday, removeHoliday,
    autoAssignLeads, assignLead, transferLeadLocation, updateLead, importLeads, createManualLead, refreshLeads, loading, error,
  }
  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCrm = () => useContext(CrmContext)
