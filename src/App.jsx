import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PublisherSelectPage from './pages/PublisherSelectPage.jsx'
import AdminLoginPage from './pages/AdminLoginPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import UnitListPage from './pages/UnitListPage.jsx'
import SubunitListPage from './pages/SubunitListPage.jsx'
import LessonListPage from './pages/LessonListPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<PublisherSelectPage />} />
          <Route path="/p/:publisherId" element={<UnitListPage />} />
          <Route path="/p/:publisherId/:unitId" element={<SubunitListPage />} />
          <Route path="/p/:publisherId/:unitId/:subunitId" element={<LessonListPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
