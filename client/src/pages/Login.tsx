import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import api from "@/services/api"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Truck, Eye, EyeOff, Lock, Mail, ShieldAlert } from "lucide-react"

// Zod Schema for validation
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  rememberMe: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Configure form with defaults for easy demo access
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "manager@transitops.com",
      password: "Password@123",
      rememberMe: true,
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      })

      if (response.data?.success) {
        const { token, user } = response.data
        
        // Save auth details in context
        login(token, user)

        // Show success notification
        toast.success(`Welcome back, ${user.name}!`, {
          description: `Logged in as ${user.role}`,
        })

        // Redirect to dashboard
        navigate("/dashboard")
      }
    } catch (error: any) {
      console.error("Login request error:", error)
      const errorMsg = error.response?.data?.message || "Invalid credentials. Please try again."
      toast.error("Authentication Failed", {
        description: errorMsg,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    toast.info("Forgot Password Placeholder", {
      description: "Password reset flows will be implemented in Phase 3.",
    })
  }

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground transition-colors duration-300">
      
      {/* LEFT SIDE: BRANDING PANEL (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        
        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/10 border border-primary/20">
            <Truck className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">TransitOps</span>
        </div>

        {/* Core Marketing Visual */}
        <div className="space-y-6 relative z-10 max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
            Smart Transport Operations Platform
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            A production-ready enterprise console to monitor vehicles, assign shipping routes, trace fuel refuelings, and audit expense ledger ledgers with dynamic role restrictions.
          </p>

          {/* Seed account quick indicators */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Demo Roles Access Credentials:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
              <div className="p-2 rounded bg-white/5 border border-white/5">
                <span className="text-indigo-400">Fleet Manager:</span>
                <p className="text-[10px] text-slate-400 truncate">manager@transitops.com</p>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/5">
                <span className="text-indigo-400">Dispatcher:</span>
                <p className="text-[10px] text-slate-400 truncate">dispatcher@transitops.com</p>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/5">
                <span className="text-indigo-400">Safety Officer:</span>
                <p className="text-[10px] text-slate-400 truncate">safety@transitops.com</p>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/5">
                <span className="text-indigo-400">Financial Analyst:</span>
                <p className="text-[10px] text-slate-400 truncate">finance@transitops.com</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">Common password for all roles: Password@123</p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 relative z-10">
          &copy; {new Date().getFullYear()} TransitOps Logistics Systems. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: SIGN-IN FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-background relative">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile logo display */}
          <div className="flex flex-col items-center text-center lg:hidden space-y-2">
            <div className="inline-flex p-3 bg-primary/10 text-primary rounded-2xl mb-2">
              <Truck className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">TransitOps</h1>
            <p className="text-muted-foreground text-sm">Smart Transport Operations Platform</p>
          </div>

          {/* Form Card Header */}
          <div className="space-y-2 text-left hidden lg:block">
            <h2 className="text-3xl font-bold tracking-tight">Access Platform</h2>
            <p className="text-muted-foreground text-sm">
              Enter your credentials to enter the operations workspace.
            </p>
          </div>

          <Card className="border-border/60 shadow-xl dark:shadow-none rounded-2xl bg-card">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="e.g. manager@transitops.com"
                      className={`w-full bg-background border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                        errors.email ? "border-destructive focus:ring-destructive/30" : "border-border focus:border-primary"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive font-medium mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-muted-foreground">Password</label>
                    <a
                      href="#"
                      onClick={handleForgotPassword}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder="••••••••"
                      className={`w-full bg-background border rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                        errors.password ? "border-destructive focus:ring-destructive/30" : "border-border focus:border-primary"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive font-medium mt-1">{errors.password.message}</p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    {...register("rememberMe")}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="rememberMe" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
                    Remember me on this browser
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-5"
                  >
                    {isSubmitting ? (
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
