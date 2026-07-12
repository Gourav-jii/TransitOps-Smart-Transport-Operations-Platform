import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import driverService from "@/services/driverService"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Loading } from "@/components/ui/Loading"
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  Activity,
  Award,
  AlertTriangle,
  Clock,
  Briefcase,
  X,
  ShieldAlert,
  FileText,
  FolderOpen,
  TrendingUp,
  AlertCircle
} from "lucide-react"

// Zod validation schema for Safety Update dialog
const safetyFormSchema = z.object({
  safetyScore: z.coerce
    .number()
    .min(0, "Safety score must be between 0 and 100")
    .max(100, "Safety score must be between 0 and 100"),
  status: z.enum(["Available", "On Trip", "Off Duty", "Suspended"]),
})

export default function DriverDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<"profile" | "trips" | "documents" | "performance" | "incidents">("profile")
  const [isSafetyOpen, setIsSafetyOpen] = useState(false)

  // Roles boundary checks
  const isManager = user?.role === "Fleet Manager"
  const isSafety = user?.role === "Safety Officer"
  const canEditSafety = isManager || isSafety

  // React Query: Fetch driver details
  const { data, isLoading, isError } = useQuery({
    queryKey: ["driver", id],
    queryFn: () => driverService.getDriverById(id!),
    enabled: !!id,
  })

  // React Query: Safety Status Update Mutation
  const safetyMutation = useMutation({
    mutationFn: ({ score, status }: { score: number; status: string }) =>
      Promise.all([
        driverService.updateDriverSafetyScore(id!, score),
        driverService.updateDriverStatus(id!, status),
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver", id] })
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Safety & Duty Status Updated", {
        description: "Compliance records updated successfully in active register.",
      })
      setIsSafetyOpen(false)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to update driver status details."
      toast.error("Compliance Action Blocked", { description: msg })
    },
  })

  const {
    register: registerSafety,
    handleSubmit: handleSafetySubmit,
    reset: resetSafety,
    formState: { errors: safetyErrors, isSubmitting: isSafetySubmitting },
  } = useForm({
    resolver: zodResolver(safetyFormSchema),
  })

  // Loading skeleton rendering
  if (isLoading) {
    return (
      <div className="space-y-6 text-left animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="border-border/60 p-6 space-y-4">
            <div className="h-20 w-20 bg-muted rounded-2xl mx-auto" />
            <div className="h-5 w-32 bg-muted mx-auto rounded" />
            <div className="h-4 w-24 bg-muted mx-auto rounded" />
            <div className="h-12 bg-muted rounded" />
          </Card>
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-border/60 p-6 space-y-6">
              <div className="flex gap-4 border-b border-border pb-2">
                <div className="h-8 w-24 bg-muted rounded" />
                <div className="h-8 w-24 bg-muted rounded" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-12 bg-muted rounded" />
                  <div className="h-12 bg-muted rounded" />
                  <div className="h-12 bg-muted rounded" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Error State rendering
  if (isError || !data?.success) {
    return (
      <div className="space-y-4 max-w-lg mx-auto text-center py-12">
        <div className="p-4 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 w-fit mx-auto">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold">Driver File Not Found</h2>
        <p className="text-muted-foreground text-sm">
          The requested driver profile ID is invalid or has been removed from the platform registry.
        </p>
        <Button onClick={() => navigate("/drivers")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Drivers Directory
        </Button>
      </div>
    )
  }

  const driver = data.data

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Monitor license expiry date
  const getLicenseCompliance = (expiryStr: string | Date) => {
    const expiry = new Date(expiryStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    if (expiry < today) {
      return {
        label: "Expired",
        style: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-300 ring-2 ring-rose-500/20",
        alert: true,
        expired: true,
      }
    } else if (expiry <= thirtyDaysFromNow) {
      return {
        label: "Expiring Soon",
        style: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300",
        alert: true,
        expired: false,
      }
    } else {
      return {
        label: "Active & Compliant",
        style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300",
        alert: false,
        expired: false,
      }
    }
  }

  // Duty status classes
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-300"
      case "On Trip":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-300"
      case "Off Duty":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400 border border-slate-300"
      case "Suspended":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-300"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800/30"
    }
  }

  const comp = getLicenseCompliance(driver.licenseExpiry)

  const openSafetyModal = () => {
    resetSafety({
      safetyScore: driver.safetyScore,
      status: driver.status,
    })
    setIsSafetyOpen(true)
  }

  const onSafetySubmit = (values: z.infer<typeof safetyFormSchema>) => {
    safetyMutation.mutate({ score: values.safetyScore, status: values.status })
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER ACTION BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/drivers")} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{driver.fullName}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(driver.status)}`}>
                {driver.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Employee ID: <span className="font-mono font-bold text-foreground/80">{driver.employeeId || "PENDING"}</span> &bull; Region: {driver.region || "Global"}
            </p>
          </div>
        </div>

        {/* Quick Compliance Action Button */}
        {canEditSafety && (
          <Button onClick={openSafetyModal} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/15">
            <ShieldAlert className="h-4.5 w-4.5" /> Compliance Checklist
          </Button>
        )}
      </div>

      {/* DRIVER STATS AND COMPLIANCE WARNING - HIGHLIGHTED IN RED IF EXPIRED */}
      {comp.expired && (
        <div className="p-4 bg-rose-50 border-2 border-rose-500 rounded-2xl flex items-start gap-3 shadow-md">
          <AlertTriangle className="h-6 w-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-left">
            <h4 className="text-sm font-bold text-rose-800">Critical License Expiry Notice</h4>
            <p className="text-xs text-rose-700 leading-normal mt-0.5 font-medium">
              This driver's license expired on {formatDate(driver.licenseExpiry)}. Under standard safety protocol guidelines, the driver has been flagged and is blocked from changing status to <strong>Available</strong> or being dispatched on new trips until license records are verified and updated.
            </p>
          </div>
        </div>
      )}

      {/* CORE PROFILE GRID SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: MINI CARD IDENTIFIER */}
        <div className="lg:col-span-1 space-y-6">
          <Card className={`border-border/60 shadow-sm text-center bg-card transition-all duration-300 ${comp.expired ? "ring-2 ring-rose-500/30" : ""}`}>
            <CardContent className="pt-6 space-y-4">
              
              {/* Profile Avatar icon */}
              <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto ring-4 ring-primary/5">
                <User className="h-10 w-10" />
              </div>

              <div>
                <h3 className="font-bold text-lg text-foreground">{driver.fullName}</h3>
                <p className="text-xs text-muted-foreground">{driver.licenseCategory} operator</p>
              </div>

              {/* Score indicator panel */}
              <div className="border-t border-b border-border/40 py-4 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="border-r border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Safety Score</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Award className="h-4.5 w-4.5 text-primary" />
                    <span className="font-bold text-sm text-foreground">{driver.safetyScore}/100</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Experience</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm text-foreground">{driver.experience} Yrs</span>
                  </div>
                </div>
              </div>

              {/* Timeline Audits */}
              <div className="space-y-2 text-left text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Joined: {formatDate(driver.joiningDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Updated: {formatDate(driver.updatedAt)}</span>
                </div>
                {driver.createdBy && (
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    <span className="truncate">Manager: {driver.createdBy.name}</span>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: MAIN DETAILS PANEL */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border/60 shadow-sm overflow-hidden bg-card">
            
            {/* Tabs Header */}
            <div className="flex bg-muted/40 border-b border-border/40 px-4 overflow-x-auto select-none no-scrollbar">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === "profile"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="h-4 w-4" /> Profile Specs
              </button>
              <button
                onClick={() => setActiveTab("trips")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === "trips"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Activity className="h-4 w-4" /> Assigned Trips
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === "documents"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderOpen className="h-4 w-4" /> Documents
              </button>
              <button
                onClick={() => setActiveTab("performance")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === "performance"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp className="h-4 w-4" /> Performance
              </button>
              <button
                onClick={() => setActiveTab("incidents")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === "incidents"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <AlertTriangle className="h-4 w-4" /> Incidents
              </button>
            </div>

            {/* TAB CONTENTS */}
            <CardContent className="p-6">
              {activeTab === "profile" && (
                <div className="space-y-6 text-left">
                  
                  {/* Licensing Compliance specs */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-primary" /> License Compliance Verification
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-muted/40 border border-border/50 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">License number</p>
                        <p className="text-sm font-semibold font-mono mt-1 text-foreground/90">{driver.licenseNumber}</p>
                      </div>
                      <div className="p-3 bg-muted/40 border border-border/50 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">License Category</p>
                        <p className="text-sm font-semibold mt-1 text-foreground/90">{driver.licenseCategory}</p>
                      </div>
                      <div className="p-3 bg-muted/40 border border-border/50 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Verification Status</p>
                        <p className={`text-xs font-bold inline-flex items-center gap-1 rounded-md px-2 py-0.5 mt-1 border ${comp.style}`}>
                          {comp.label}
                        </p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-border/40" />

                  {/* Personal Contact Details */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-primary" /> Contact Channels
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/40 border border-border/50 rounded-xl flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground/60" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Phone number</p>
                          <p className="text-sm font-semibold text-foreground/90 mt-0.5">{driver.contactNumber}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-muted/40 border border-border/50 rounded-xl flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground/60" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Email address</p>
                          <p className="text-sm font-semibold text-foreground/90 mt-0.5">{driver.email || "N/A"}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-muted/40 border border-border/50 rounded-xl flex items-center gap-3 md:col-span-2">
                        <MapPin className="h-5 w-5 text-muted-foreground/60 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Residential Address</p>
                          <p className="text-sm font-semibold text-foreground/90 mt-0.5">{driver.address || "No residential address provided."}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-border/40" />

                  {/* Emergency contact point */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-primary" /> Emergency Contact Point
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/40 border border-border/50 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Contact Name</p>
                        <p className="text-sm font-semibold text-foreground/95 mt-1">{driver.emergencyContactName || "N/A"}</p>
                      </div>
                      <div className="p-3 bg-muted/40 border border-border/50 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Contact Phone Number</p>
                        <p className="text-sm font-semibold text-foreground/95 mt-1">{driver.emergencyContactNumber || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-border/40" />

                  {/* Operator remarks */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary" /> Compliance & Audit Remarks
                    </h3>
                    <div className="p-4 bg-muted/30 border border-border/40 rounded-xl text-xs leading-relaxed text-muted-foreground">
                      {driver.remarks || "No compliance notes or audit remarks registered for this driver profile."}
                    </div>
                  </div>

                </div>
              )}

              {/* FUTURE TAB PLACEHOLDERS */}
              {activeTab === "trips" && (
                <div className="space-y-4 text-center py-8">
                  <div className="h-12 w-12 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 max-w-xs mx-auto">
                    <h4 className="font-bold text-foreground/80 text-sm">Assigned Trips</h4>
                    <p className="text-xs text-muted-foreground">No active trip assignments logged. Trip functionality is disabled for this module phase.</p>
                  </div>
                </div>
              )}

              {activeTab === "documents" && (
                <div className="space-y-4 text-center py-8">
                  <div className="h-12 w-12 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto">
                    <FolderOpen className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 max-w-xs mx-auto">
                    <h4 className="font-bold text-foreground/80 text-sm">Driver Documents</h4>
                    <p className="text-xs text-muted-foreground">Verification documents and license scans upload placeholder.</p>
                  </div>
                </div>
              )}

              {activeTab === "performance" && (
                <div className="space-y-4 text-center py-8">
                  <div className="h-12 w-12 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 max-w-xs mx-auto">
                    <h4 className="font-bold text-foreground/80 text-sm">Performance Audit</h4>
                    <p className="text-xs text-muted-foreground">Driver logs, speed rating metrics, and fuel compliance score analytics placeholder.</p>
                  </div>
                </div>
              )}

              {activeTab === "incidents" && (
                <div className="space-y-4 text-center py-8">
                  <div className="h-12 w-12 bg-rose-500/5 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 max-w-xs mx-auto">
                    <h4 className="font-bold text-foreground/80 text-sm">Safety Incidents</h4>
                    <p className="text-xs text-muted-foreground">Speeding alerts, collision reports, and safety policy violations dashboard placeholder.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- SAFETY OFFICER DIALOG FORM --- */}
      {isSafetyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md scale-100 transition-all duration-300">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Compliance Checklist</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update safety audits for: <span className="font-semibold text-foreground">{driver.fullName}</span>
                </p>
              </div>
              <button
                onClick={() => setIsSafetyOpen(false)}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSafetySubmit(onSafetySubmit)} className="p-6 space-y-4 text-left">
              
              {/* Safety Score */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-primary" /> Safety Rating Score (0-100) *
                </label>
                <input
                  type="number"
                  {...registerSafety("safetyScore")}
                  defaultValue={driver.safetyScore}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary font-bold"
                />
                {safetyErrors.safetyScore && (
                  <p className="text-xs text-destructive font-medium">{safetyErrors.safetyScore.message}</p>
                )}
              </div>

              {/* Status Update */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Duty Status *
                </label>
                <select
                  {...registerSafety("status")}
                  defaultValue={driver.status}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="Suspended">Suspended</option>
                </select>
                {safetyErrors.status && (
                  <p className="text-xs text-destructive font-medium">{safetyErrors.status.message}</p>
                )}
              </div>

              {/* Warnings and compliance blockers info */}
              <div className="p-3 bg-muted border border-border/60 rounded-lg space-y-1.5 text-xs text-muted-foreground leading-normal">
                <p>&bull; Expired license drivers cannot be set to <strong>Available</strong> status.</p>
                <p>&bull; Manually changing duty status is blocked if currently assigned to active Trip.</p>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-border/40 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsSafetyOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSafetySubmitting} className="flex items-center gap-1.5 shadow-lg shadow-amber-500/10">
                  {isSafetySubmitting && <Loading size="sm" />}
                  Submit Actions
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
