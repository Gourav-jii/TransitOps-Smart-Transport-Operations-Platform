import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import auditService, { type AuditLogData } from "@/services/auditService"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  X,
  FileCode,
  ShieldCheck,
  User,
  Clock,
  Database,
  AlertTriangle
} from "lucide-react"

export default function AuditLogs() {
  const [module, setModule] = useState("")
  const [action, setAction] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(15)

  // Details Modal
  const [selectedAudit, setSelectedAudit] = useState<AuditLogData | null>(null)

  const filters = {
    module: module || undefined,
    action: action || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
  }

  // React Query: Fetch logs
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["auditLogs", filters],
    queryFn: () => auditService.getAuditLogs(filters).then(res => res.data),
  })

  const logs = data?.data?.logs || []
  const pagination = data?.data?.pagination || { total: 0, pages: 1, page: 1, limit: 15 }

  const handleResetFilters = () => {
    setModule("")
    setAction("")
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getActionBadgeColor = (act: string) => {
    switch (act) {
      case "Create":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-300"
      case "Update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-300"
      case "Delete":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-300"
      case "Login":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-300"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800/20 dark:text-slate-400"
    }
  }

  const getModuleBadgeColor = (mod: string) => {
    switch (mod) {
      case "Auth":
        return "bg-purple-500/10 text-purple-500"
      case "Vehicles":
        return "bg-blue-500/10 text-blue-500"
      case "Drivers":
        return "bg-amber-500/10 text-amber-500"
      case "Trips":
        return "bg-indigo-500/10 text-indigo-500"
      case "Maintenance":
        return "bg-pink-500/10 text-pink-500"
      case "Documents":
        return "bg-cyan-500/10 text-cyan-500"
      default:
        return "bg-slate-500/10 text-slate-500"
    }
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground/90">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            System security log registry tracking write actions, logins, and session modifications.
          </p>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          
          {/* Module */}
          <div className="flex flex-col gap-1.5 min-w-[120px]">
            <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Module</label>
            <select
              value={module}
              onChange={(e) => {
                setModule(e.target.value)
                setPage(1)
              }}
              className="bg-background border border-border/80 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Modules</option>
              <option value="Auth">Auth</option>
              <option value="Vehicles">Vehicles</option>
              <option value="Drivers">Drivers</option>
              <option value="Trips">Trips</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Documents">Documents</option>
              <option value="Fuel Logs">Fuel Logs</option>
              <option value="Expenses">Expenses</option>
            </select>
          </div>

          {/* Action */}
          <div className="flex flex-col gap-1.5 min-w-[120px]">
            <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Action Type</label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value)
                setPage(1)
              }}
              className="bg-background border border-border/80 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Actions</option>
              <option value="Create">Create</option>
              <option value="Update">Update</option>
              <option value="Delete">Delete</option>
              <option value="Login">Login</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(1)
              }}
              className="bg-background border border-border/80 rounded-lg px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 h-8"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(1)
              }}
              className="bg-background border border-border/80 rounded-lg px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 h-8"
            />
          </div>

          {/* Reset button */}
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs h-8 flex items-center gap-1">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </CardContent>
      </Card>

      {/* LOADINGUX */}
      {isLoading && (
        <Card className="border-border/60 animate-pulse bg-card overflow-hidden">
          <div className="p-12 text-center text-xs text-muted-foreground">Syncing audit database...</div>
        </Card>
      )}

      {/* ERROR */}
      {isError && (
        <Card className="border-destructive/30 bg-destructive/5 p-8 text-center text-destructive">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3" />
          <h3 className="font-bold text-lg">Error Syncing Audits</h3>
          <p className="text-sm mt-1 text-muted-foreground">Unable to fetch logs. Please ensure MongoDB connections are active.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4 border-destructive/20 text-destructive">
            Retry Connection
          </Button>
        </Card>
      )}

      {/* DATA GRID */}
      {!isLoading && !isError && data && (
        <Card className="border-border/60 shadow-sm overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-extrabold tracking-wider border-b border-border/40 select-none">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Operator User</th>
                  <th className="p-4 text-center">Module</th>
                  <th className="p-4 text-center">Action</th>
                  <th className="p-4">Entity Details</th>
                  <th className="p-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Database className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <h4 className="font-bold text-foreground/80">No Audit Logs Found</h4>
                        <p className="text-xs">Try clearing your filters or logging in to trigger authentication records.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log._id} className="hover:bg-muted/15 transition-colors text-left">
                      <td className="p-4 font-semibold text-xs text-muted-foreground flex items-center gap-1.5 pt-6">
                        <Clock className="h-3.5 w-3.5 text-primary/75" />
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-foreground/95 leading-none block">{log.user?.name || "System"}</span>
                            <span className="text-[9px] text-muted-foreground font-semibold mt-0.5 leading-none block">{log.user?.role || "COUNTER"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getModuleBadgeColor(log.module)}`}>
                          {log.module}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-xs">
                        {log.entityName ? (
                          <div className="space-y-0.5">
                            <span className="text-foreground/95 font-semibold block">{log.entityName}</span>
                            <span className="text-[10px] text-muted-foreground block font-mono">ID: {log.entityId}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40 font-semibold">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {(log.beforeValue || log.afterValue) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAudit(log)}
                            className="h-8 text-primary hover:bg-primary/10 font-bold"
                          >
                            <Eye className="h-4 w-4 mr-1" /> Inspect
                          </Button>
                        ) : (
                          <span className="text-muted-foreground/30 font-semibold text-xs pr-4">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-border/40 flex items-center justify-between bg-muted/15 select-none">
              <span className="text-xs text-muted-foreground font-medium">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total logs)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className="h-8 px-2"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* --- VALUE DIFF INSPECTION MODAL --- */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col scale-100 transition-all duration-300">
            
            {/* Header */}
            <div className="p-5 border-b border-border/40 flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                  <FileCode className="h-5 w-5 text-primary" /> Inspect Document Values Snapshot
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Module: <strong>{selectedAudit.module}</strong> &bull; Action: <strong>{selectedAudit.action}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Split body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              
              {/* Before Value */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase text-rose-500 tracking-wider flex items-center gap-1">
                  <RotateCcw className="h-3.5 w-3.5" /> Document State Before Action
                </h4>
                <div className="bg-secondary/60 border border-border/50 rounded-xl p-4 font-mono text-[10px] leading-relaxed overflow-x-auto max-h-96 select-text">
                  {selectedAudit.beforeValue ? (
                    <pre>{JSON.stringify(selectedAudit.beforeValue, null, 2)}</pre>
                  ) : (
                    <span className="text-muted-foreground/60 italic font-semibold">No initial values (Record Created)</span>
                  )}
                </div>
              </div>

              {/* After Value */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase text-emerald-500 tracking-wider flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Document State After Action
                </h4>
                <div className="bg-secondary/60 border border-border/50 rounded-xl p-4 font-mono text-[10px] leading-relaxed overflow-x-auto max-h-96 select-text">
                  {selectedAudit.afterValue ? (
                    <pre>{JSON.stringify(selectedAudit.afterValue, null, 2)}</pre>
                  ) : (
                    <span className="text-muted-foreground/60 italic font-semibold font-sans">No values captured (Record Deleted)</span>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/40 flex justify-end bg-muted/10">
              <Button onClick={() => setSelectedAudit(null)} className="h-9 px-4 font-semibold">
                Close Inspector
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}


