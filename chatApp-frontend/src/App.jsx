import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from '@/context/AuthContext'
import { AuthPage } from '@/pages/AuthPage'
import { ChatWorkspacePage } from '@/pages/ChatWorkspacePage'

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth()

  return isAuthenticated ? <Navigate to="/app" replace /> : children
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  return isAuthenticated ? children : <Navigate to="/auth" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route
        path="/auth"
        element={
          <PublicOnlyRoute>
            <AuthPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <ChatWorkspacePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}

export default App
