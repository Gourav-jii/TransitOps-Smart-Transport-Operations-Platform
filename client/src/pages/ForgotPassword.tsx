import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import api from "@/services/api"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Truck, Eye, EyeOff, Lock, Mail, Key, ShieldAlert, ArrowLeft } from "lucide-react"

const requestPinSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
})

const resetPasswordSchema = z.object({
  code: z.string().min(6, "Verification PIN must be at least 6 digits").max(6, "PIN must be exactly 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
})

type RequestPinValues = z.infer<typeof requestPinSchema>
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [emailAddress, setEmailAddress] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [devResetCode, setDevResetCode] = useState<string | null>(null)

  // Step 1: Request PIN Form
  const requestForm = useForm<RequestPinValues>({
    resolver: zodResolver(requestPinSchema),
    defaultValues: { email: "" },
  })

  // Step 2: Reset Password Form
  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: "", newPassword: "" },
  })

  const onRequestPinSubmit = async (data: RequestPinValues) => {
    setIsSubmitting(true)
    try {
      const response = await api.post("/auth/forgot-password", {
        email: data.email,
      })

      if (response.data?.success) {
        setEmailAddress(data.email)
        toast.success("Verification Code Generated!", {
          description: "Check your terminal or server console logs.",
        })
        if (response.data.resetCode) {
          setDevResetCode(response.data.resetCode)
        }
        setStep(2)
      }
    } catch (error: any) {
      console.error("Forgot password error:", error)
      const errorMsg = error.response?.data?.message || "Failed to generate verification PIN."
      toast.error("Request Failed", {
        description: errorMsg,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onResetSubmit = async (data: ResetPasswordValues) => {
    setIsSubmitting(true)
    try {
      const response = await api.post("/auth/reset-password", {
        email: emailAddress,
        code: data.code,
        newPassword: data.newPassword,
      })

      if (response.data?.success) {
        toast.success("Password Updated Successfully!", {
          description: "Sign in using your new credentials.",
        })
        navigate("/login")
      }
    } catch (error: any) {
      console.error("Reset password error:", error)
      const errorMsg = error.response?.data?.message || "Invalid or expired verification PIN."
      toast.error("Reset Failed", {
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
            Recover Access credentials
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Verify your account credentials using security codes to reset and update passwords securely.
          </p>
        </div>

        <div className="text-xs text-slate-500 relative z-10">
          &copy; {new Date().getFullYear()} TransitOps Logistics Systems. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: RESET PASSWORD STEPS */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-background relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="flex flex-col items-center text-center lg:hidden space-y-2">
            <div className="inline-flex p-3 bg-primary/10 text-primary rounded-2xl mb-2">
              <Truck className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">TransitOps</h1>
            <p className="text-muted-foreground text-sm">Security Password Recovery</p>
          </div>

          <div className="space-y-2 text-left hidden lg:block">
            <h2 className="text-3xl font-bold tracking-tight">Reset Password</h2>
            <p className="text-muted-foreground text-sm">
              {step === 1 
                ? "Enter your registered email address to request a verification PIN." 
                : `Enter the verification PIN sent to ${emailAddress}.`
              }
            </p>
          </div>

          <Card className="border-border/60 shadow-xl rounded-2xl bg-card">
            <CardContent className="pt-6">
              
              {/* STEP 1: Enter email */}
              {step === 1 && (
                <form onSubmit={requestForm.handleSubmit(onRequestPinSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        {...requestForm.register("email")}
                        placeholder="e.g. manager@transitops.com"
                        className={`w-full bg-background border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                          requestForm.formState.errors.email ? "border-destructive focus:ring-destructive/30" : "border-border focus:border-primary"
                        }`}
                      />
                    </div>
                    {requestForm.formState.errors.email && (
                      <p className="text-xs text-destructive font-medium mt-1">{requestForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-5"
                    >
                      {isSubmitting ? (
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Generate Verification PIN"
                      )}
                    </Button>
                  </div>

                  <div className="text-center pt-2">
                    <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-semibold">
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                    </Link>
                  </div>
                </form>
              )}

              {/* STEP 2: Enter PIN and new password */}
              {step === 2 && (
                <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                  
                  {/* Dev Mode Helper Code Display */}
                  {devResetCode && (
                    <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs space-y-1 flex items-start gap-2 text-left">
                      <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Developer Sandbox Mode:</span>
                        The server returned verification code: <code className="font-mono bg-primary/20 px-1.5 py-0.5 rounded font-bold">{devResetCode}</code>
                      </div>
                    </div>
                  )}

                  {/* Verification PIN Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">6-Digit Verification PIN</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        maxLength={6}
                        {...resetForm.register("code")}
                        placeholder="e.g. 123456"
                        className={`w-full bg-background border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono tracking-widest ${
                          resetForm.formState.errors.code ? "border-destructive focus:ring-destructive/30" : "border-border focus:border-primary"
                        }`}
                      />
                    </div>
                    {resetForm.formState.errors.code && (
                      <p className="text-xs text-destructive font-medium mt-1">{resetForm.formState.errors.code.message}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        {...resetForm.register("newPassword")}
                        placeholder="••••••••"
                        className={`w-full bg-background border rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                          resetForm.formState.errors.newPassword ? "border-destructive focus:ring-destructive/30" : "border-border focus:border-primary"
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
                    {resetForm.formState.errors.newPassword && (
                      <p className="text-xs text-destructive font-medium mt-1">{resetForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-5"
                    >
                      {isSubmitting ? (
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-semibold"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Request a new PIN code
                    </button>
                  </div>
                </form>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
