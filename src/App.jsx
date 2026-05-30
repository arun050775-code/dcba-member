import { Routes, Route, Navigate } from 'react-router-dom'
import { MemberAuthProvider, useMemberAuth } from './context/MemberAuthContext'
import { Toaster } from 'react-hot-toast'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Profile from './components/Profile'
import Dues from './components/Dues'
import MemberGrievances from './components/MemberGrievances'
import MemberNotices from './components/MemberNotices'
import MemberRequests from './components/MemberRequests'
import Certificate from './components/Certificate'

function PrivateRoute({ children }) {
  const { member, loading } = useMemberAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return member ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { member } = useMemberAuth()
  return (
    <Routes>
      <Route path="/login" element={member ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/dues" element={<PrivateRoute><Dues /></PrivateRoute>} />
      <Route path="/grievances" element={<PrivateRoute><MemberGrievances /></PrivateRoute>} />
      <Route path="/requests" element={<PrivateRoute><MemberRequests /></PrivateRoute>} />
      <Route path="/certificate" element={<Navigate to="/requests" replace />} />
      <Route path="/notices" element={<PrivateRoute><MemberNotices /></PrivateRoute>} />
      <Route path="/certificate" element={<PrivateRoute><Certificate /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <MemberAuthProvider>
      <Toaster position="top-center" />
      <AppRoutes />
    </MemberAuthProvider>
  )
}
