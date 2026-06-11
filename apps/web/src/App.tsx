import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Dashboard } from '@/pages/Dashboard'
import { PetProfile } from '@/pages/PetProfile'
import { WeightHistory } from '@/pages/WeightHistory'
import { DietPlan } from '@/pages/DietPlan'
import { HealthRecords } from '@/pages/HealthRecords'
import { Settings } from '@/pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Ładowanie...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/pets/:id" element={<ProtectedRoute><PetProfile /></ProtectedRoute>} />
      <Route path="/pets/:id/weight" element={<ProtectedRoute><WeightHistory /></ProtectedRoute>} />
      <Route path="/pets/:id/diet" element={<ProtectedRoute><DietPlan /></ProtectedRoute>} />
      <Route path="/pets/:id/health" element={<ProtectedRoute><HealthRecords /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
