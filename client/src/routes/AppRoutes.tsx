import React from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import Dashboard from "@/pages/Dashboard"
import Vehicles from "@/pages/Vehicles"
import VehicleDetails from "@/pages/VehicleDetails"
import Drivers from "@/pages/Drivers"
import DriverDetails from "@/pages/DriverDetails"
import Trips from "@/pages/Trips"
import TripDetails from "@/pages/TripDetails"
import Maintenance from "@/pages/Maintenance"
import FuelLogs from "@/pages/FuelLogs"
import Expenses from "@/pages/Expenses"
import Reports from "@/pages/Reports"
import Settings from "@/pages/Settings"
import Profile from "@/pages/Profile"
import Login from "@/pages/Login"
import Unauthorized from "@/pages/Unauthorized"
import NotFound from "@/pages/NotFound"
import { useAuth, type UserRole } from "@/context/AuthContext"
import { Loading } from "@/components/ui/Loading"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

// Protected Route Wrapper with Role Guard
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return <Loading fullPage label="Verifying credentials..." />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

// Public Route Wrapper (redirects authenticated users to dashboard)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <Loading fullPage label="Restoring session..." />
  }

  if (isAuthenticated) {
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

      {/* Protected App Layout Wrapper */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Pages accessible by any authenticated user */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        {/* Role-Protected Pages */}
        
        {/* Vehicles: Fleet Manager, Dispatcher, Safety Officer & Financial Analyst */}
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute allowedRoles={["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]}>
              <Vehicles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles/:id"
          element={
            <ProtectedRoute allowedRoles={["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]}>
              <VehicleDetails />
            </ProtectedRoute>
          }
        />

        {/* Drivers: Fleet Manager, Dispatcher, Safety Officer & Financial Analyst */}
        <Route
          path="/drivers"
          element={
            <ProtectedRoute allowedRoles={["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]}>
              <Drivers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/drivers/:id"
          element={
            <ProtectedRoute allowedRoles={["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]}>
              <DriverDetails />
            </ProtectedRoute>
          }
        />

        {/* Trips: Fleet Manager, Dispatcher, Safety Officer & Financial Analyst */}
        <Route
          path="/trips"
          element={
            <ProtectedRoute allowedRoles={["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]}>
              <Trips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:id"
          element={
            <ProtectedRoute allowedRoles={["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]}>
              <TripDetails />
            </ProtectedRoute>
          }
        />

        {/* Maintenance: Fleet Manager only */}
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute allowedRoles={["Fleet Manager"]}>
              <Maintenance />
            </ProtectedRoute>
          }
        />

        {/* Fuel Logs: Fleet Manager, Financial Analyst, Dispatcher & Safety Officer */}
        <Route
          path="/fuel-logs"
          element={
            <ProtectedRoute allowedRoles={["Fleet Manager", "Financial Analyst", "Dispatcher", "Safety Officer"]}>
              <FuelLogs />
            </ProtectedRoute>
          }
        />

        {/* Expenses: Fleet Manager, Financial Analyst, Dispatcher & Safety Officer */}
        <Route
          path="/expenses"
          element={
            <ProtectedRoute allowedRoles={["Fleet Manager", "Financial Analyst", "Dispatcher", "Safety Officer"]}>
              <Expenses />
            </ProtectedRoute>
          }
        />

        {/* Reports: Fleet Manager, Safety Officer, Financial Analyst & Dispatcher */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["Fleet Manager", "Safety Officer", "Financial Analyst", "Dispatcher"]}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Settings: Fleet Manager only */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["Fleet Manager"]}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Error & Fallback Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
