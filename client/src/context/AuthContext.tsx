import React, { createContext, useContext, useEffect, useState } from "react"
import api from "@/services/api"

export type UserRole = "Fleet Manager" | "Dispatcher" | "Safety Officer" | "Financial Analyst"

export interface User {
  id: string
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize authentication state from local storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("transitops-token")
      const storedUser = localStorage.getItem("transitops-user")

      if (storedToken && storedUser) {
        try {
          setToken(storedToken)
          // Set in-memory user first for fast visual load
          setUser(JSON.parse(storedUser))

          // Perform a background verification request to ensure token is still valid
          const response = await api.get("/auth/me")
          if (response.data?.success && response.data?.user) {
            setUser(response.data.user)
            localStorage.setItem("transitops-user", JSON.stringify(response.data.user))
          } else {
            // Invalid session response
            handleLogout()
          }
        } catch (error) {
          console.error("Auth session restore failed, clearing credentials:", error)
          handleLogout()
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const handleLogin = (jwtToken: string, userData: User) => {
    localStorage.setItem("transitops-token", jwtToken)
    localStorage.setItem("transitops-user", JSON.stringify(userData))
    setToken(jwtToken)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem("transitops-token")
    localStorage.removeItem("transitops-user")
    setToken(null)
    setUser(null)
  }

  const handleUpdateUser = (updatedUser: User) => {
    localStorage.setItem("transitops-user", JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  const value: AuthContextType = {
    user,
    token,
    role: user ? user.role : null,
    isAuthenticated: !!token && !!user,
    loading,
    login: handleLogin,
    logout: handleLogout,
    updateUser: handleUpdateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
