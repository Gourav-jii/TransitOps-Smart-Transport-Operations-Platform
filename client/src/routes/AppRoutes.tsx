import { Navigate, Route, Routes } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import Dashboard from "@/pages/Dashboard"
import Vehicles from "@/pages/Vehicles"
import Drivers from "@/pages/Drivers"
import Trips from "@/pages/Trips"
import Maintenance from "@/pages/Maintenance"
import FuelLogs from "@/pages/FuelLogs"
import Expenses from "@/pages/Expenses"
import Reports from "@/pages/Reports"
import Settings from "@/pages/Settings"
import Profile from "@/pages/Profile"
import Login from "@/pages/Login"
import Unauthorized from "@/pages/Unauthorized"
import NotFound from "@/pages/NotFound"

// Mock auth helper
const isAuthenticated = () => {
  return localStorage.getItem("transitops-mock-token") === "true"
}

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

// Public Route Wrapper (redirects to dashboard if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Route */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Root redirection to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected App Routes under AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/fuel-logs" element={<FuelLogs />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Error & Fallback Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
