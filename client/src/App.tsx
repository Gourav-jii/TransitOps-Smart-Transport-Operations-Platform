import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/context/ThemeContext"
import { AuthProvider } from "@/context/AuthContext"
import AppRoutes from "@/routes/AppRoutes"
import { Toaster } from "sonner"

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="transitops-ui-theme">
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            {/* Toast Notification Container */}
            <Toaster 
              position="top-right" 
              richColors 
              closeButton 
              theme="system" 
            />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
