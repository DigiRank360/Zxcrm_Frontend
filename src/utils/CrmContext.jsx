import { createContext, useContext, useState } from 'react'
import { leads as l0, attendance as a0, installations as i0, maintenance as m0, agents, workers } from '../data/mockData'
import { generateQuarterlySchedule } from './helpers'

const CrmContext = createContext(null)

export function CrmProvider({ children }) {
  const [leads, setLeads] = useState(l0)
  const [attendance, setAttendance] = useState(a0)
  const [installations, setInstallations] = useState(i0)
  const [maintenance, setMaintenance] = useState(m0)

  const addInstallation = (inst) => {
    const id = Date.now()
    setInstallations((p) => [...p, { ...inst, id, status: 'Active' }])
    const tickets = generateQuarterlySchedule(inst.installDate).map((dueDate, i) => ({
      id: id + i + 1, installationId: id, dueDate, workerId: workers[i % workers.length].id, status: 'Pending',
    }))
    setMaintenance((p) => [...p, ...tickets])
  }

  const value = {
    agents, workers, leads, setLeads, attendance, setAttendance,
    installations, addInstallation, maintenance, setMaintenance,
  }
  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCrm = () => useContext(CrmContext)
