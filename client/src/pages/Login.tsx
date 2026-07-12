import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { useNavigate } from "react-router-dom"
import { Truck } from "lucide-react"

export default function Login() {
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulated mock authentication redirect
    localStorage.setItem("transitops-mock-token", "true")
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 px-4 relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary/20 text-primary rounded-xl mb-4 shadow-lg shadow-primary/10 border border-primary/20">
            <Truck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">TransitOps</h1>
          <p className="text-slate-400 text-sm mt-1">Smart Transport Operations Platform</p>
        </div>

        <Card className="glass border-white/10 shadow-2xl rounded-2xl bg-slate-900/60 text-white">
          <CardHeader>
            <CardTitle className="text-xl text-white">Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access operations dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@transitops.com"
                  defaultValue="admin@transitops.com"
                  className="w-full bg-slate-950/60 border border-white/15 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  defaultValue="password"
                  className="w-full bg-slate-950/60 border border-white/15 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">
                  Access Platform
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
