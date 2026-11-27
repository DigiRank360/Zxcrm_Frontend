import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CrmProvider } from './utils/CrmContext'
import { AuthProvider, useAuth } from './utils/AuthContext'
import Layout from './components/Layout'
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Leads = lazy(() => import('./pages/Leads'))
const LeadSources = lazy(() => import('./pages/LeadSources'))
const Assignment = lazy(() => import('./pages/Assignment'))
const AgentCalling = lazy(() => import('./pages/AgentCalling'))
const Installations = lazy(() => import('./pages/Installations'))
const Maintenance = lazy(() => import('./pages/Maintenance'))
const Technician = lazy(() => import('./pages/Technician'))
const Team = lazy(() => import('./pages/Team'))
const Customers = lazy(() => import('./pages/Customers'))
const HrPanel = lazy(() => import('./pages/HrPanel'))
const Visits = lazy(() => import('./pages/Visits'))
const MyProfile = lazy(() => import('./pages/MyProfile'))

const home = { admin: Dashboard, hr: HrPanel, employee: EmployeeDashboard, technician: Technician }

function Home() {
  const { user } = useAuth()
  const Page = home[user.role]
  return <Page />
}

function AppRoutes() {
  const { user } = useAuth()
  if (!user) return <Login />
  const only = (roles, el) => ((Array.isArray(roles) ? roles : [roles]).includes(user.role) ? el : <Navigate to="/" replace />)
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="customers" element={<Customers />} />
        <Route path="sources" element={only('admin', <LeadSources />)} />
        <Route path="leads" element={only('admin', <Leads />)} />
        <Route path="assignment" element={only('admin', <Assignment />)} />
        <Route path="installations" element={only(['admin', 'employee'], <Installations />)} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="team" element={only('admin', <Team />)} />
        <Route path="my-calls" element={only('employee', <AgentCalling />)} />
        <Route path="visits" element={only(['admin', 'hr', 'employee'], <Visits />)} />
        <Route path="hr" element={only('hr', <HrPanel />)} />
        <Route path="my-profile" element={only(['employee', 'technician'], <MyProfile />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CrmProvider>
          <Suspense fallback={<div role="status" className="p-6 text-slate-500">Loading page...</div>}>
            <AppRoutes />
          </Suspense>
        </CrmProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
