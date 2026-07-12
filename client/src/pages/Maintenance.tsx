import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import maintenanceService, {
  type MaintenanceData,
  type FetchMaintenanceParams,
} from "@/services/maintenanceService"
import api from "@/services/api" // Helper to fetch vehicles raw
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Loading } from "@/components/ui/Loading"
import {
  Plus,
  Search,
  ArrowUpDown,
  Edit2,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
  AlertTriangle,
  Info,
  Calendar,
  AlertCircle,
  Play,
  CheckCircle,
  Wrench,
  DollarSign
} from "lucide-react"

// Zod schema for full maintenance creation/edit
const maintenanceFormSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle selection is required"),
  maintenanceType: z.enum([
    "Oil Change",
    "Engine Service",
    "Brake Service",
    "Tyre Replacement",
    "Battery Replacement",
    "Insurance Renewal",
    "Fitness Renewal",
    "Pollution Renewal",
    "General Service",
    "Repair",
    "Emergency Repair",
    "Other",
  ]),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  vendor: z.string().min(2, "Vendor must be at least 2 characters"),
  technician: z.string().optional(),
  estimatedCost: z.coerce.number().min(0, "Estimated cost cannot be negative"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  status: z.enum(["Scheduled", "Active"]),
  remarks: z.string().optional(),
})

// Zod schema for complete maintenance PATCH
const completeFormSchema = z.object({
  actualCost: z.coerce.number().min(0, "Actual cost cannot be negative"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  remarks: z.string().optional(),
})

export default function Maintenance() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Role authorization boundaries
  const isManager = user?.role === "Fleet Manager"

  // Search, Pagination, Filters State
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [vehicleFilter, setVehicleFilter] = useState("")
  const [startDateFilter, setStartDateFilter] = useState("")
  const [endDateFilter, setEndDateFilter] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<MaintenanceData | null>(null)

  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const [completingLog, setCompletingLog] = useState<MaintenanceData | null>(null)

  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Construct fetch params
  const fetchParams: FetchMaintenanceParams = {
    page,
    limit,
    search: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    maintenanceType: typeFilter || undefined,
    vehicleId: vehicleFilter || undefined,
    startDate: startDateFilter || undefined,
    endDate: endDateFilter || undefined,
    sortBy,
    sortOrder,
  }

  // React Query: Fetch Maintenance records
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["maintenance", fetchParams],
    queryFn: () => maintenanceService.getMaintenanceLogs(fetchParams),
  })

  // React Query: Fetch raw vehicles list for form selector dropdown
  const { data: vehiclesData } = useQuery({
    queryKey: ["allVehicles"],
    queryFn: async () => {
      const response = await api.get("/vehicles?limit=100")
      return response.data?.data?.vehicles || []
    },
  })

  const vehicles = (vehiclesData || []).filter((v: any) => v.status !== "Retired")

  // React Query: Create Mutation
  const createMutation = useMutation({
    mutationFn: maintenanceService.createMaintenance,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("Maintenance Scheduled", {
        description: `Service task ${res.data.maintenanceId} logged successfully.`,
      })
      closeFormModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to log maintenance task."
      toast.error("Operation Blocked", { description: msg })
    },
  })

  // React Query: Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MaintenanceData> }) =>
      maintenanceService.updateMaintenance(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] })
      toast.success("Task Updated", {
        description: `Task ${res.data.maintenanceId} details modified successfully.`,
      })
      closeFormModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to update details."
      toast.error("Update Error", { description: msg })
    },
  })

  // React Query: Start Status Transition Mutation
  const startMutation = useMutation({
    mutationFn: maintenanceService.startMaintenance,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("Maintenance Started", {
        description: `Task ${res.data.maintenanceId} is now active. Vehicle status set to In Shop.`,
      })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to start maintenance."
      toast.error("Action Blocked", { description: msg })
    },
  })

  // React Query: Complete Status Transition Mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, actualCost, invoiceNumber, remarks }: { id: string; actualCost: number; invoiceNumber: string; remarks?: string }) =>
      maintenanceService.completeMaintenance(id, { actualCost, invoiceNumber, remarks }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("Service Completed", {
        description: `Maintenance ${res.data.maintenanceId} finished. Vehicle status reverted to Available.`,
      })
      closeCompleteModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to complete service."
      toast.error("Completion Error", { description: msg })
    },
  })

  // React Query: Cancel Status Transition Mutation
  const cancelMutation = useMutation({
    mutationFn: maintenanceService.cancelMaintenance,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] })
      toast.success("Maintenance Cancelled", {
        description: `Service task ${res.data.maintenanceId} set to Cancelled.`,
      })
      closeCancelModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to cancel task."
      toast.error("Action Failed", { description: msg })
    },
  })

  // React Query: Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: maintenanceService.deleteMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] })
      toast.success("Record Deleted", {
        description: "Maintenance log removed permanently from platform registry.",
      })
      closeDeleteModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to delete log."
      toast.error("Deletion Blocked", { description: msg })
    },
  })

  // Form setups
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors: formErrors, isSubmitting: isFormSubmitting },
  } = useForm({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      vehicleId: "",
      maintenanceType: "Oil Change" as const,
      title: "",
      description: "",
      vendor: "",
      technician: "",
      estimatedCost: 0,
      scheduledDate: new Date().toISOString().split("T")[0],
      priority: "Medium" as const,
      status: "Scheduled" as const,
      remarks: "",
    },
  })

  const selectedVehicleId = watch("vehicleId")
  const selectedVehicle = vehicles.find((v: any) => v._id === selectedVehicleId)

  const {
    register: registerComplete,
    handleSubmit: handleCompleteSubmit,
    reset: resetComplete,
    formState: { errors: completeErrors, isSubmitting: isCompleteSubmitting },
  } = useForm({
    resolver: zodResolver(completeFormSchema),
  })

  // Modal open handlers
  const openAddModal = () => {
    setEditingLog(null)
    reset({
      vehicleId: "",
      maintenanceType: "Oil Change" as const,
      title: "",
      description: "",
      vendor: "",
      technician: "",
      estimatedCost: 0,
      scheduledDate: new Date().toISOString().split("T")[0],
      priority: "Medium" as const,
      status: "Scheduled" as const,
      remarks: "",
    })
    setIsFormOpen(true)
  }

  const openEditModal = (log: MaintenanceData) => {
    setEditingLog(log)
    reset({
      vehicleId: typeof log.vehicle === "string" ? log.vehicle : log.vehicle._id,
      maintenanceType: log.maintenanceType,
      title: log.title,
      description: log.description,
      vendor: log.vendor,
      technician: log.technician || "",
      estimatedCost: log.estimatedCost,
      scheduledDate: log.scheduledDate ? new Date(log.scheduledDate).toISOString().split("T")[0] : "",
      priority: log.priority,
      status: log.status === "Active" ? "Active" : "Scheduled",
      remarks: log.remarks || "",
    })
    setIsFormOpen(true)
  }

  const openCompleteModal = (log: MaintenanceData) => {
    setCompletingLog(log)
    resetComplete({
      actualCost: log.estimatedCost,
      invoiceNumber: "",
      remarks: "",
    })
    setIsCompleteOpen(true)
  }

  const openCancelModal = (id: string) => {
    setCancellingId(id)
    setIsCancelOpen(true)
  }

  const openDeleteModal = (id: string) => {
    setDeletingId(id)
    setIsDeleteOpen(true)
  }

  const closeFormModal = () => {
    setIsFormOpen(false)
    setEditingLog(null)
  }

  const closeCompleteModal = () => {
    setIsCompleteOpen(false)
    setCompletingLog(null)
  }

  const closeCancelModal = () => {
    setIsCancelOpen(false)
    setCancellingId(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteOpen(false)
    setDeletingId(null)
  }

  const onFormSubmit = (values: z.infer<typeof maintenanceFormSchema>) => {
    if (editingLog) {
      updateMutation.mutate({ id: editingLog._id!, data: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const onCompleteSubmit = (values: z.infer<typeof completeFormSchema>) => {
    if (completingLog) {
      completeMutation.mutate({
        id: completingLog._id!,
        actualCost: values.actualCost,
        invoiceNumber: values.invoiceNumber,
        remarks: values.remarks,
      })
    }
  }

  const resetFilters = () => {
    setSearch("")
    setStatusFilter("")
    setPriorityFilter("")
    setTypeFilter("")
    setVehicleFilter("")
    setStartDateFilter("")
    setEndDateFilter("")
    setSortBy("createdAt")
    setSortOrder("desc")
    setPage(1)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
    setPage(1)
  }

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
        return "bg-slate-100 text-slate-800 dark:bg-slate-800/30"
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

  // Count summaries
  const scheduledCount = data?.data?.maintenanceLogs?.filter((l) => l.status === "Scheduled").length || 0
  const activeCount = data?.data?.maintenanceLogs?.filter((l) => l.status === "Active").length || 0

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Maintenance Logs</h1>
          <p className="text-muted-foreground mt-1">
            Schedule fleet repairs, log vendor invoice bills, check cert alerts, and monitor vehicle shop status.
          </p>
        </div>
        {isManager && (
          <Button onClick={openAddModal} className="flex items-center gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4.5 w-4.5" /> Log Service Record
          </Button>
        )}
      </div>

      {/* STATS PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/60 bg-card/65 shadow-sm">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1 text-left">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Servicing</p>
              <h3 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{activeCount} Vehicles</h3>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
              <Wrench className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/65 shadow-sm">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1 text-left">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scheduled Tasks</p>
              <h3 className="text-2xl font-extrabold text-slate-700 dark:text-slate-300">{scheduledCount} Servicings</h3>
            </div>
            <div className="h-12 w-12 bg-slate-500/10 text-slate-500 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/65 shadow-sm">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1 text-left">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expiry Warning Flags</p>
              <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">Scan Alerts</h3>
            </div>
            <div className="h-12 w-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTERS & SEARCH ROW */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by vehicle reg number, maintenance ID, vendor, or invoice..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-background border border-border/80 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Reset filters */}
            <div className="flex items-center">
              <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs flex items-center gap-1.5 h-9">
                <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
              </Button>
            </div>
          </div>

          {/* ADVANCED SELECT FILTERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1 border-t border-border/40">
            
            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Service Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All Types</option>
                {[
                  "Oil Change",
                  "Engine Service",
                  "Brake Service",
                  "Tyre Replacement",
                  "Battery Replacement",
                  "Insurance Renewal",
                  "Fitness Renewal",
                  "Pollution Renewal",
                  "General Service",
                  "Repair",
                  "Emergency Repair",
                  "Other",
                ].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Start */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Scheduled From</label>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => {
                  setStartDateFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Date Range End */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Scheduled To</label>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => {
                  setEndDateFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LOADING SKELETON */}
      {isLoading && (
        <Card className="border-border/60 shadow-sm overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-extrabold tracking-wider border-b border-border/40">
                <tr>
                  <th className="p-4">Log ID</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Service Type</th>
                  <th className="p-4 text-center">Priority</th>
                  <th className="p-4">Vendor</th>
                  <th className="p-4 text-right">Est. Cost</th>
                  <th className="p-4 text-right">Actual Cost</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Scheduled Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="p-4 text-center"><div className="h-5 w-12 bg-muted rounded mx-auto" /></td>
                    <td className="p-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                    <td className="p-4 text-right"><div className="h-4 w-16 bg-muted rounded ml-auto" /></td>
                    <td className="p-4 text-right"><div className="h-4 w-16 bg-muted rounded ml-auto" /></td>
                    <td className="p-4 text-center"><div className="h-5 w-16 bg-muted rounded mx-auto" /></td>
                    <td className="p-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="p-4 text-right"><div className="h-6 w-16 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ERROR STATE */}
      {isError && (
        <Card className="border-destructive/30 bg-destructive/5 p-8 text-center text-destructive">
          <AlertCircle className="h-10 w-10 mx-auto mb-3" />
          <h3 className="font-bold text-lg">Error Syncing Log Register</h3>
          <p className="text-sm mt-1 text-muted-foreground">Could not connect to operations database server. Please check MongoDB connection.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4 border-destructive/20 hover:bg-destructive/10 text-destructive">
            Retry Connection
          </Button>
        </Card>
      )}

      {/* DATA TABLE */}
      {!isLoading && !isError && data && (
        <Card className="border-border/60 shadow-sm overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-extrabold tracking-wider border-b border-border/40 select-none">
                <tr>
                  <th className="p-4 cursor-pointer hover:bg-muted/60 transition-colors" onClick={() => handleSort("maintenanceId")}>
                    <div className="flex items-center gap-1.5">
                      Log ID
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    </div>
                  </th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Service Type</th>
                  <th className="p-4 text-center cursor-pointer hover:bg-muted/60 transition-colors" onClick={() => handleSort("priority")}>
                    <div className="flex items-center justify-center gap-1.5">
                      Priority
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    </div>
                  </th>
                  <th className="p-4">Vendor</th>
                  <th className="p-4 text-right cursor-pointer hover:bg-muted/60 transition-colors" onClick={() => handleSort("estimatedCost")}>
                    <div className="flex items-center justify-end gap-1.5">
                      Est. Cost
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    </div>
                  </th>
                  <th className="p-4 text-right cursor-pointer hover:bg-muted/60 transition-colors" onClick={() => handleSort("actualCost")}>
                    <div className="flex items-center justify-end gap-1.5">
                      Actual Cost
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    </div>
                  </th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 cursor-pointer hover:bg-muted/60 transition-colors" onClick={() => handleSort("scheduledDate")}>
                    <div className="flex items-center gap-1.5">
                      Scheduled Date
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    </div>
                  </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.data.maintenanceLogs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-muted-foreground">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Info className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <h4 className="font-bold text-foreground/80">No Records Found</h4>
                        <p className="text-xs">Try adjusting your filters, query text, or log a new maintenance task.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.data.maintenanceLogs.map((log) => {
                    const veh = log.vehicle as any;
                    return (
                      <tr key={log._id} className="hover:bg-muted/15 transition-colors group text-left">
                        <td className="p-4 font-mono font-bold text-xs">
                          <Link to={`/maintenance/${log._id}`} className="text-primary hover:underline">
                            {log.maintenanceId || "PENDING"}
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-foreground/95">{veh?.registrationNumber || "N/A"}</span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">{veh?.vehicleName || "Unknown"}</span>
                        </td>
                        <td className="p-4 font-medium text-xs text-muted-foreground flex items-center gap-1.5 pt-6">
                          <Wrench className="h-3.5 w-3.5 text-primary" />
                          {log.maintenanceType}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPriorityBadge(log.priority)}`}>
                            {log.priority}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-xs">{log.vendor}</td>
                        <td className="p-4 text-right font-mono font-semibold text-xs">${log.estimatedCost.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono font-semibold text-xs">
                          {log.actualCost !== undefined ? `$${log.actualCost.toFixed(2)}` : <span className="text-muted-foreground/40">-</span>}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadge(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-semibold text-muted-foreground">
                          {formatDate(log.scheduledDate)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            
                            {/* View details */}
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/maintenance/${log._id}`)} className="h-8 w-8 p-0" title="View Details">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>

                            {/* Perform Start Action (Scheduled -> Active) */}
                            {isManager && log.status === "Scheduled" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startMutation.mutate(log._id!)}
                                className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-500/10"
                                title="Start Maintenance"
                              >
                                <Play className="h-4 w-4 fill-current" />
                              </Button>
                            )}

                            {/* Perform Complete Action (Active -> Completed) */}
                            {isManager && log.status === "Active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openCompleteModal(log)}
                                className="h-8 w-8 p-0 text-emerald-500 hover:bg-emerald-500/10"
                                title="Complete Maintenance"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Perform Cancel Action */}
                            {isManager && (log.status === "Scheduled" || log.status === "Active") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openCancelModal(log._id!)}
                                className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10"
                                title="Cancel Maintenance"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Full Edit (Manager Only) */}
                            {isManager && log.status === "Scheduled" && (
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(log)} className="h-8 w-8 p-0" title="Edit Schedule">
                                <Edit2 className="h-4 w-4 text-primary/80" />
                              </Button>
                            )}

                            {/* Full Delete */}
                            {isManager && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(log._id!)}
                                className="h-8 w-8 p-0 hover:bg-destructive/10"
                                title="Delete Record"
                              >
                                <Trash2 className="h-4 w-4 text-destructive/85" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION PANEL */}
          <div className="p-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/15">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
                className="bg-background border border-border/80 rounded p-1 text-xs focus:outline-none font-medium"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs text-muted-foreground font-medium">
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, data.data.pagination.total)} of {data.data.pagination.total} records
              </span>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: data.data.pagination.pages }, (_, i) => i + 1).map((pNum) => (
                <Button
                  key={pNum}
                  variant={pNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pNum)}
                  className="h-8 w-8 p-0 text-xs font-semibold"
                >
                  {pNum}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(data.data.pagination.pages, page + 1))}
                disabled={page === data.data.pagination.pages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* --- ADD / EDIT FORM MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col scale-100 transition-all duration-300">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {editingLog ? `Edit Service Log (${editingLog.maintenanceId})` : "Log Preventative Maintenance Service"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Allocate vehicle logistics, vendors, priority details, and estimated expenses.
                </p>
              </div>
              <button
                onClick={closeFormModal}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
              
              {selectedVehicle && selectedVehicle.status === "On Trip" && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-800 dark:text-rose-300 leading-normal">
                    <strong>Vehicle is currently Dispatching:</strong> Vehicle `{selectedVehicle.registrationNumber}` is On Trip. You cannot start an <strong>Active</strong> maintenance record immediately. You can only create a <strong>Scheduled</strong> log.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Vehicle Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Select Fleet Vehicle *</label>
                  <select
                    {...register("vehicleId")}
                    disabled={!!editingLog}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  >
                    <option value="">Choose a vehicle...</option>
                    {vehicles.map((v: any) => (
                      <option key={v._id} value={v._id}>
                        {v.registrationNumber} - {v.vehicleName} ({v.status})
                      </option>
                    ))}
                  </select>
                  {formErrors.vehicleId && (
                    <p className="text-xs text-destructive font-medium">{formErrors.vehicleId.message}</p>
                  )}
                </div>

                {/* Maintenance Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Maintenance Type *</label>
                  <select
                    {...register("maintenanceType")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {[
                      "Oil Change",
                      "Engine Service",
                      "Brake Service",
                      "Tyre Replacement",
                      "Battery Replacement",
                      "Insurance Renewal",
                      "Fitness Renewal",
                      "Pollution Renewal",
                      "General Service",
                      "Repair",
                      "Emergency Repair",
                      "Other",
                    ].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Subject / Title *</label>
                  <input
                    type="text"
                    {...register("title")}
                    placeholder="e.g. 50k miles inspection and filter swaps"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {formErrors.title && (
                    <p className="text-xs text-destructive font-medium">{formErrors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Detailed Description *</label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Describe maintenance breakdown details, issues reported, and part replacements expected..."
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {formErrors.description && (
                    <p className="text-xs text-destructive font-medium">{formErrors.description.message}</p>
                  )}
                </div>

                {/* Vendor */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Vendor Workshop *</label>
                  <input
                    type="text"
                    {...register("vendor")}
                    placeholder="e.g. Apex Fleet Repairs Inc"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {formErrors.vendor && (
                    <p className="text-xs text-destructive font-medium">{formErrors.vendor.message}</p>
                  )}
                </div>

                {/* Technician */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Assigned Technician Name</label>
                  <input
                    type="text"
                    {...register("technician")}
                    placeholder="e.g. Robert Miller"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Estimated Cost */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Estimated Cost ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("estimatedCost")}
                    placeholder="e.g. 450.00"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                  />
                  {formErrors.estimatedCost && (
                    <p className="text-xs text-destructive font-medium">{formErrors.estimatedCost.message}</p>
                  )}
                </div>

                {/* Scheduled Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Scheduled Date *</label>
                  <input
                    type="date"
                    {...register("scheduledDate")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {formErrors.scheduledDate && (
                    <p className="text-xs text-destructive font-medium">{formErrors.scheduledDate.message}</p>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Priority Level *</label>
                  <select
                    {...register("priority")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* Status selector (only Scheduled or Active permitted on create/update) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Maintenance Status *</label>
                  <select
                    {...register("status")}
                    disabled={!!editingLog}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Active">Active (In Shop)</option>
                  </select>
                </div>

                {/* Remarks */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Remarks & Compliance Notes</label>
                  <textarea
                    {...register("remarks")}
                    rows={2}
                    placeholder="Log auxiliary notes or specific replacement instructions..."
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-border/40 flex justify-end gap-3 bg-muted/5 p-4 rounded-xl">
                <Button type="button" variant="outline" onClick={closeFormModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isFormSubmitting} className="min-w-[100px] flex items-center gap-1.5">
                  {isFormSubmitting && <Loading size="sm" />}
                  {editingLog ? "Save Changes" : "Create Record"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- COMPLETE FORM DIALOG --- */}
      {isCompleteOpen && completingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md scale-100 transition-all duration-300">
            
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Complete Service Order</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Record final billing invoice details for: <span className="font-semibold text-foreground">{completingLog.maintenanceId}</span>
                </p>
              </div>
              <button
                onClick={closeCompleteModal}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit(onCompleteSubmit)} className="p-6 space-y-4 text-left">
              
              {/* Actual Cost */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-primary" /> Actual Final Cost ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...registerComplete("actualCost")}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                />
                {completeErrors.actualCost && (
                  <p className="text-xs text-destructive font-medium">{completeErrors.actualCost.message}</p>
                )}
              </div>

              {/* Invoice Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Vendor Invoice Number *</label>
                <input
                  type="text"
                  {...registerComplete("invoiceNumber")}
                  placeholder="e.g. INV-990283"
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-semibold"
                />
                {completeErrors.invoiceNumber && (
                  <p className="text-xs text-destructive font-medium">{completeErrors.invoiceNumber.message}</p>
                )}
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Completion remarks</label>
                <textarea
                  {...registerComplete("remarks")}
                  rows={2}
                  placeholder="e.g. Engine diagnostics clean. All filters swapped successfully."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="pt-4 border-t border-border/40 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeCompleteModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCompleteSubmitting} className="flex items-center gap-1.5">
                  {isCompleteSubmitting && <Loading size="sm" />}
                  Finish Maintenance
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM CANCEL DIALOG --- */}
      {isCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md scale-100 transition-all duration-300">
            <div className="p-6 space-y-4 text-center">
              <div className="h-12 w-12 bg-amber-500/15 rounded-full flex items-center justify-center text-amber-500 mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">Cancel Maintenance Task</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Are you sure you want to cancel this maintenance order? If active, the associated vehicle status will be set back to <strong>Available</strong>.
                </p>
              </div>

              <div className="pt-3 flex gap-3 justify-center">
                <Button variant="outline" onClick={closeCancelModal}>
                  Close
                </Button>
                <Button
                  onClick={() => cancelMutation.mutate(cancellingId!)}
                  disabled={cancelMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5"
                >
                  {cancelMutation.isPending && <Loading size="sm" />}
                  Yes, Cancel Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE DIALOG --- */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md scale-100 transition-all duration-300">
            <div className="p-6 space-y-4 text-center">
              <div className="h-12 w-12 bg-destructive/15 rounded-full flex items-center justify-center text-destructive mx-auto">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">Confirm Log Deletion</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Are you sure you want to permanently delete this maintenance log? This action is irreversible.
                </p>
              </div>

              <div className="pt-3 flex gap-3 justify-center">
                <Button variant="outline" onClick={closeDeleteModal}>
                  Keep Record
                </Button>
                <Button
                  onClick={() => deleteMutation.mutate(deletingId!)}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive hover:bg-destructive/90 text-white flex items-center gap-1.5"
                >
                  {deleteMutation.isPending && <Loading size="sm" />}
                  Delete Record
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
