import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CrmProvider } from './utils/CrmContext'
import { AuthProvider, useAuth } from './utils/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import Attendance from './pages/Attendance'
import Leads from './pages/Leads'
import LeadSources from './pages/LeadSources'
import Assignment from './pages/Assignment'
import AgentCalling from './pages/AgentCalling'
import Installations from './pages/Installations'
import Maintenance from './pages/Maintenance'
import Technician from './pages/Technician'
import Team from './pages/Team'

const home = { admin: Dashboard, employee: EmployeeDashboard, technician: Technician }

function Home() {
  const { user } = useAuth()
  const Page = home[user.role]
  return <Page />
}

function AppRoutes() {
  const { user } = useAuth()
  if (!user) return <Login />
  const only = (role, el) => (user.role === role ? el : <Navigate to="/" replace />)
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="sources" element={only('admin', <LeadSources />)} />
        <Route path="leads" element={only('admin', <Leads />)} />
        <Route path="assignment" element={only('admin', <Assignment />)} />
        <Route path="installations" element={only('admin', <Installations />)} />
        <Route path="maintenance" element={only('admin', <Maintenance />)} />
        <Route path="team" element={only('admin', <Team />)} />
        <Route path="my-calls" element={only('employee', <AgentCalling />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CrmProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CrmProvider>
    </AuthProvider>
  )
}
