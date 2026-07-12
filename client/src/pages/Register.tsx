import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import api from "@/services/api"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Truck, Eye, EyeOff, Lock, Mail, User } from "lucide-react"

const registerSchema = z.object({
  name: z.string().min(2, "Full Name must be at least 2 characters long"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "Dispatcher",
    },
  })

  const selectedRole = watch("role")

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      })

      if (response.data?.success) {
        toast.success("Account Registered Successfully!", {
          description: "You can now sign in using your credentials.",
        })
        navigate("/login")
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      const errorMsg = error.response?.data?.message || "Registration failed. Email might already exist."
      toast.error("Registration Failed", {
        description: errorMsg,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground transition-colors duration-300">
      
      {/* LEFT SIDE: BRANDING PANEL */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg border border-primary/20">
            <Truck className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">TransitOps</span>
        </div>

        <div className="space-y-6 relative z-10 max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
            Join TransitOps Command
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Create an operational profile to begin assigning dispatch schedules, managing fleet registers, logging fuel logs, and auditing compliance tracks.
          </p>
        </div>

        <div className="text-xs text-slate-500 relative z-10">
          &copy; {new Date().getFullYear()} TransitOps Logistics Systems. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: SIGN-UP FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-background relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="flex flex-col items-center text-center lg:hidden space-y-2">
            <div className="inline-flex p-3 bg-primary/10 text-primary rounded-2xl mb-2">
              <Truck className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">TransitOps</h1>
            <p className="text-muted-foreground text-sm">Join the Logistics Network</p>
          </div>

          <div className="space-y-2 text-left hidden lg:block">
            <h2 className="text-3xl font-bold tracking-tight">Create Account</h2>
            <p className="text-muted-foreground text-sm">
              Sign up for a role profile to access the command console.
            </p>
          </div>

          <Card className="border-border/60 shadow-xl rounded-2xl bg-card">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      {...register("name")}
                      placeholder="e.g. Lancelot du Lac"
                      className={`w-full bg-background border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                        errors.name ? "border-destructive focus:ring-destructive/30" : "border-border focus:border-primary"
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-destructive font-medium mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="e.g. safety@transitops.com"
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
                  <label className="text-xs font-semibold text-muted-foreground">Password</label>
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

                {/* Role Selector Grid */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Assigned Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "Fleet Manager", label: "Fleet Manager" },
                      { value: "Dispatcher", label: "Dispatcher" },
                      { value: "Safety Officer", label: "Safety Officer" },
                      { value: "Financial Analyst", label: "Financial Analyst" },
                    ].map((roleOption) => (
                      <button
                        key={roleOption.value}
                        type="button"
                        onClick={() => setValue("role", roleOption.value as any)}
                        className={`p-2.5 text-xs font-bold rounded-lg border text-left transition-all ${
                          selectedRole === roleOption.value
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background border-border text-muted-foreground hover:bg-muted/10"
                        }`}
                      >
                        {roleOption.label}
                      </button>
                    ))}
                  </div>
                  {errors.role && (
                    <p className="text-xs text-destructive font-medium mt-1">{errors.role.message}</p>
                  )}
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
                      "Create Profile"
                    )}
                  </Button>
                </div>

                {/* Link to login */}
                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:underline font-semibold">
                      Sign In here
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
