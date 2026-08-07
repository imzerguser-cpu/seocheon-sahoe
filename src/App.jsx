import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import SuperAdminRoute from './components/SuperAdminRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import AdminLoginPage from './pages/AdminLoginPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import MaterialsAdminPage from './pages/MaterialsAdminPage.jsx'
import MaterialReviewPage from './pages/MaterialReviewPage.jsx'
import QuizzesAdminPage from './pages/QuizzesAdminPage.jsx'
import QuizReviewPage from './pages/QuizReviewPage.jsx'
import SchoolPasswordsPage from './pages/SchoolPasswordsPage.jsx'
import UnitListPage from './pages/UnitListPage.jsx'
import LessonDetailPage from './pages/LessonDetailPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import StudentQuizSubmitPage from './pages/StudentQuizSubmitPage.jsx'

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
          <Route path="/quiz/:publisherId/:scope/:refId" element={<QuizPage />} />
          <Route
            path="/p/:publisherId/:unitId/:topicId/:lessonId/quiz-submit"
            element={<StudentQuizSubmitPage />}
          />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/materials" element={<MaterialsAdminPage />} />
          <Route path="/admin/quizzes" element={<QuizzesAdminPage />} />
          <Route path="/admin/quizzes/review" element={<QuizReviewPage />} />
          <Route path="/admin/school-passwords" element={<SchoolPasswordsPage />} />
        </Route>

        <Route element={<SuperAdminRoute />}>
          <Route path="/admin/materials/review" element={<MaterialReviewPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}
