import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import maintenanceService from "@/services/maintenanceService"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import {
  ArrowLeft,
  Wrench,
  User,
  DollarSign,
  Clock,
  Briefcase,
  AlertCircle,
  Truck
} from "lucide-react"

export default function MaintenanceDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Fetch single maintenance details
  const { data, isLoading, isError } = useQuery({
    queryKey: ["maintenanceLog", id],
    queryFn: () => maintenanceService.getMaintenanceLogById(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="space-y-6 text-left animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 h-60 bg-muted rounded-2xl" />
            <Card className="p-6 h-48 bg-muted rounded-2xl" />
          </div>
          <Card className="p-6 h-96 bg-muted rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError || !data?.success) {
    return (
      <div className="space-y-4 max-w-lg mx-auto text-center py-12">
        <div className="p-4 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 w-fit mx-auto">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold">Log Record Not Found</h2>
        <p className="text-muted-foreground text-sm">
          The requested maintenance file ID is invalid or has been removed from the platform database.
        </p>
        <Button onClick={() => navigate("/maintenance")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Maintenance Board
        </Button>
      </div>
    )
  }

  const log = data.data
  const veh = log.vehicle as any

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateStr?: string | Date) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400 border border-slate-300"
      case "Active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-300"
      case "Completed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-300"
      case "Cancelled":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-300"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 font-extrabold border border-rose-300"
      case "High":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 font-bold border border-amber-300"
      case "Medium":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-300"
      case "Low":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800/20 dark:text-slate-400 border border-slate-300"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const costDifference = log.actualCost !== undefined ? log.actualCost - log.estimatedCost : 0

  return (
    <div className="space-y-6 text-left">
      
      {/* HEADER ACTION BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/maintenance")} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{log.maintenanceId || "PENDING"}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(log.status)}`}>
                {log.status}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPriorityBadge(log.priority)}`}>
                {log.priority} Priority
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Service Order Type: <span className="font-bold text-foreground/80">{log.maintenanceType}</span> &bull; Logged: {formatDate(log.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* THREE COLUMN GRID SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: VEHICLE DETAILS & COST SUMMARY */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CORE DETAILS CARD */}
          <Card className="border-border/60 shadow-sm bg-card">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-sm font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-primary" /> Service Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">{log.title}</h3>
                <p className="text-sm text-muted-foreground leading-normal">{log.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-muted/40 border border-border/50 rounded-xl flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground/60" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Vendor Workshop</p>
                    <p className="text-sm font-semibold text-foreground/90 mt-0.5">{log.vendor}</p>
                  </div>
                </div>

                <div className="p-3 bg-muted/40 border border-border/50 rounded-xl flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground/60" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Technician</p>
                    <p className="text-sm font-semibold text-foreground/90 mt-0.5">{log.technician || "Unassigned"}</p>
                  </div>
                </div>
              </div>

              {log.remarks && (
                <div className="p-4 bg-muted/30 border border-border/40 rounded-xl text-xs leading-relaxed text-muted-foreground mt-2">
                  <span className="font-bold block mb-1 text-foreground/80">Compliance Remarks:</span>
                  {log.remarks}
                </div>
              )}
            </CardContent>
          </Card>

          {/* COST SUMMARY CARD */}
          <Card className="border-border/60 shadow-sm bg-card">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-sm font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary" /> Cost & Billing Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="p-4 bg-muted/20 border border-border/40 rounded-2xl text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Estimated Cost</p>
                  <h4 className="text-xl font-extrabold text-foreground mt-1">${log.estimatedCost.toFixed(2)}</h4>
                </div>

                <div className="p-4 bg-muted/20 border border-border/40 rounded-2xl text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Actual Cost</p>
                  <h4 className="text-xl font-extrabold text-foreground mt-1">
                    {log.actualCost !== undefined ? `$${log.actualCost.toFixed(2)}` : <span className="text-muted-foreground/40">-</span>}
                  </h4>
                </div>

                <div className={`p-4 border rounded-2xl text-center ${
                  log.actualCost === undefined
                    ? "bg-slate-500/5 border-slate-300"
                    : costDifference > 0
                    ? "bg-rose-500/5 border-rose-300 text-rose-600"
                    : "bg-emerald-500/5 border-emerald-300 text-emerald-600"
                }`}>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Variance</p>
                  <h4 className="text-xl font-extrabold mt-1">
                    {log.actualCost !== undefined ? (
                      `${costDifference > 0 ? "+" : ""}$${costDifference.toFixed(2)}`
                    ) : (
                      <span className="text-muted-foreground/40">-</span>
                    )}
                  </h4>
                </div>
              </div>

              {log.invoiceNumber && (
                <div className="mt-4 p-3 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-muted-foreground">Billing Invoice Reference:</span>
                  <span className="font-mono font-bold text-foreground text-sm">{log.invoiceNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AUDIT HISTORY CARD */}
          <Card className="border-border/60 shadow-sm bg-card">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-sm font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" /> Audit History Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase font-extrabold tracking-wider border-b border-border/30">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">User Admin</th>
                      <th className="p-3 text-center">Action</th>
                      <th className="p-3 text-center">Prev Status</th>
                      <th className="p-3 text-center">New Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {log.auditHistory && log.auditHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">No audit trails registered.</td>
                      </tr>
                    ) : (
                      log.auditHistory?.map((audit, index) => (
                        <tr key={index} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 text-muted-foreground font-semibold">
                            {formatDate(audit.timestamp)} &bull; {formatTime(audit.timestamp)}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-foreground/80">{audit.user?.name || "System Counter"}</span>
                            <span className="text-[9px] text-muted-foreground block mt-0.5">{audit.user?.role || "Operator"}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              audit.action === "Created" ? "bg-slate-100 text-slate-800" :
                              audit.action === "Started" ? "bg-blue-100 text-blue-800" :
                              audit.action === "Completed" ? "bg-emerald-100 text-emerald-800" :
                              "bg-rose-100 text-rose-800"
                            }`}>
                              {audit.action}
                            </span>
                          </td>
                          <td className="p-3 text-center text-muted-foreground font-semibold">
                            {audit.prevStatus || <span className="text-muted-foreground/30">-</span>}
                          </td>
                          <td className="p-3 text-center text-foreground font-bold">
                            {audit.newStatus}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: VEHICLE SPECS & TIMELINE PROGRESS */}
        <div className="space-y-6">
          
          {/* VEHICLE INFO CARD */}
          <Card className="border-border/60 shadow-sm bg-card">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-sm font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-primary" /> Vehicle Registry File
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-foreground leading-tight">{veh?.registrationNumber}</h4>
                  <p className="text-xs text-muted-foreground">{veh?.manufacturer} {veh?.model}</p>
                </div>
              </div>

              <div className="border-t border-border/40 pt-4 space-y-2.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Name/Identifier:</span>
                  <span className="font-semibold text-foreground/90">{veh?.vehicleName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Registry Status:</span>
                  <span className="font-semibold text-foreground/90">{veh?.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Odometer Miles:</span>
                  <span className="font-semibold text-foreground/90 font-mono">{veh?.currentOdometer} miles</span>
                </div>
                <div className="flex justify-between">
                  <span>Operating Region:</span>
                  <span className="font-semibold text-foreground/90">{veh?.region || "Global"}</span>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* TIMELINE TRACKER PROGRESS */}
          <Card className="border-border/60 shadow-sm bg-card">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-sm font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" /> Status Progression
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              
              <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                
                {/* 1. SCHEDULED */}
                <div className="relative flex gap-3 text-left">
                  <span className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-400 bg-card flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  </span>
                  <div>
                    <h5 className="font-bold text-xs text-foreground">Scheduled Maintenance Log</h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Target: {formatDate(log.scheduledDate)}</p>
                  </div>
                </div>

                {/* 2. ACTIVE */}
                <div className="relative flex gap-3 text-left">
                  <span className={`absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-card flex items-center justify-center ${
                    log.startDate ? "border-blue-500" : "border-slate-300"
                  }`}>
                    {log.startDate && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                  </span>
                  <div>
                    <h5 className={`font-bold text-xs ${log.startDate ? "text-foreground" : "text-muted-foreground"}`}>Active Shop Servicing</h5>
                    {log.startDate ? (
                      <p className="text-[10px] text-muted-foreground mt-0.5">Started: {formatDate(log.startDate)} &bull; {formatTime(log.startDate)}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">Not started yet</p>
                    )}
                  </div>
                </div>

                {/* 3. TERMINUS (Completed or Cancelled) */}
                <div className="relative flex gap-3 text-left">
                  <span className={`absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-card flex items-center justify-center ${
                    log.status === "Completed" ? "border-emerald-500" :
                    log.status === "Cancelled" ? "border-rose-500" :
                    "border-slate-300"
                  }`}>
                    {log.status === "Completed" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                    {log.status === "Cancelled" && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                  </span>
                  <div>
                    <h5 className={`font-bold text-xs ${
                      log.status === "Completed" ? "text-emerald-700 dark:text-emerald-400" :
                      log.status === "Cancelled" ? "text-rose-700 dark:text-rose-400" :
                      "text-muted-foreground"
                    }`}>
                      {log.status === "Completed" ? "Completed & Resolved" :
                       log.status === "Cancelled" ? "Cancelled Order" :
                       "Terminated & Finished"}
                    </h5>
                    {log.endDate ? (
                      <p className="text-[10px] text-muted-foreground mt-0.5">Resolved: {formatDate(log.endDate)} &bull; {formatTime(log.endDate)}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">Pending resolution</p>
                    )}
                  </div>
                </div>

              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

