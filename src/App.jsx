import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import AdminLoginPage from './pages/AdminLoginPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import UnitListPage from './pages/UnitListPage.jsx'
import LessonDetailPage from './pages/LessonDetailPage.jsx'
import QuizPage from './pages/QuizPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/p/:publisherId" element={<UnitListPage />} />
          <Route
            path="/p/:publisherId/:unitId/:topicId/:lessonId"
            element={<LessonDetailPage />}
          />
          <Route path="/quiz/:scope/:refId" element={<QuizPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}
