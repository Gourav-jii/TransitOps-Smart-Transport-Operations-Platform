import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import driverService, { type DriverData, type FetchDriversParams } from "@/services/driverService"
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
  Award,
  Info,
  Calendar,
  AlertCircle
} from "lucide-react"

// Zod validation schema for Driver Form (Full Add/Edit by Manager)
const driverFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  licenseNumber: z
    .string()
    .min(1, "License number is required")
    .toUpperCase(),
  licenseCategory: z.string().min(1, "License category is required"),
  licenseExpiry: z.string().refine((val) => {
    const expiryDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !isNaN(expiryDate.getTime()) && expiryDate > today;
  }, { message: "License expiry date must be a future date" }),
  contactNumber: z
    .string()
    .min(1, "Contact number is required")
    .regex(/^[\d\s+\-()]{7,20}$/, "Invalid contact number format"),
  email: z
    .string()
    .email("Invalid email format")
    .or(z.literal("")),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z
    .string()
    .regex(/^[\d\s+\-()]{7,20}$/, "Invalid phone format")
    .or(z.literal(""))
    .optional(),
  joiningDate: z.string().optional(),
  safetyScore: z.coerce
    .number()
    .min(0, "Safety score cannot be negative")
    .max(100, "Safety score cannot exceed 100")
    .default(100),
  experience: z.coerce
    .number()
    .min(0, "Experience cannot be negative")
    .default(0),
  region: z.string().optional(),
  status: z.enum(["Available", "On Trip", "Off Duty", "Suspended"]),
  remarks: z.string().optional(),
})

// Zod validation schema for Safety Officer compliance form
const safetyFormSchema = z.object({
  safetyScore: z.coerce
    .number()
    .min(0, "Safety score must be between 0 and 100")
    .max(100, "Safety score must be between 0 and 100"),
  status: z.enum(["Available", "On Trip", "Off Duty", "Suspended"]),
})

export default function Drivers() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Role checking
  const isManager = user?.role === "Fleet Manager"
  const isSafety = user?.role === "Safety Officer"
  const canEditFull = isManager
  const canEditSafety = isManager || isSafety

  // Table filtering and pagination state
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [statusFilter, setStatusFilter] = useState("")
  const [regionFilter, setRegionFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [scoreRangeFilter, setScoreRangeFilter] = useState("")
  const [expiringSoonFilter, setExpiringSoonFilter] = useState(false)
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Modal display states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<DriverData | null>(null)
  
  const [isSafetyOpen, setIsSafetyOpen] = useState(false)
  const [safetyDriver, setSafetyDriver] = useState<DriverData | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingName, setDeletingName] = useState("")

  // Map safety score filters
  let minSafetyScore: number | undefined
  let maxSafetyScore: number | undefined
  if (scoreRangeFilter === "high") {
    minSafetyScore = 90
    maxSafetyScore = 100
  } else if (scoreRangeFilter === "medium") {
    minSafetyScore = 75
    maxSafetyScore = 89
  } else if (scoreRangeFilter === "critical") {
    minSafetyScore = 0
    maxSafetyScore = 74
  }

  // Construct fetch params
  const fetchParams: FetchDriversParams = {
    page,
    limit,
    search: search || undefined,
    status: statusFilter || undefined,
    region: regionFilter || undefined,
    licenseCategory: categoryFilter || undefined,
    minSafetyScore,
    maxSafetyScore,
    expiringSoon: expiringSoonFilter ? "true" : undefined,
    sortBy,
    sortOrder,
  }

  // React Query: Fetch Drivers
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["drivers", fetchParams],
    queryFn: () => driverService.getDrivers(fetchParams),
  })

  // React Query: Create Driver Mutation
  const createMutation = useMutation({
    mutationFn: driverService.createDriver,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Driver Registered", {
        description: `${res.data.fullName} registered under ID ${res.data.employeeId}.`,
      })
      closeFormModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to create driver profile."
      toast.error("Registration Error", { description: msg })
    },
  })

  // React Query: Update Driver Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DriverData> }) =>
      driverService.updateDriver(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Profile Updated", {
        description: `Driver ${res.data.fullName} details updated successfully.`,
      })
      closeFormModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to update driver profile."
      toast.error("Update Error", { description: msg })
    },
  })

  // React Query: Safety Compliance Update Mutation
  const safetyMutation = useMutation({
    mutationFn: ({ id, score, status }: { id: string; score: number; status: string }) =>
      Promise.all([
        driverService.updateDriverSafetyScore(id, score),
        driverService.updateDriverStatus(id, status),
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Safety Status Updated", {
        description: "Driver safety score and status updated successfully.",
      })
      closeSafetyModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to update safety details."
      toast.error("Safety Officer Action Failed", { description: msg })
    },
  })

  // React Query: Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: driverService.deleteDriver,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Deletion Successful", {
        description: res.message || "Driver removed from active database.",
      })
      closeDeleteModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to delete driver record."
      toast.error("Deletion Blocked", { description: msg })
    },
  })

  // Setup main forms (no custom generic types to prevent TS compile warnings)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors, isSubmitting: isFormSubmitting },
  } = useForm({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      fullName: "",
      licenseNumber: "",
      licenseCategory: "",
      licenseExpiry: "",
      contactNumber: "",
      email: "",
      address: "",
      emergencyContactName: "",
      emergencyContactNumber: "",
      joiningDate: new Date().toISOString().split("T")[0],
      safetyScore: 100,
      experience: 0,
      region: "",
      status: "Available" as const,
      remarks: "",
    },
  })

  // Setup safety form
  const {
    register: registerSafety,
    handleSubmit: handleSafetySubmit,
    reset: resetSafety,
    formState: { errors: safetyErrors, isSubmitting: isSafetySubmitting },
  } = useForm({
    resolver: zodResolver(safetyFormSchema),
  })

  // Modal open handlers
  const openAddModal = () => {
    setEditingDriver(null)
    reset({
      fullName: "",
      licenseNumber: "",
      licenseCategory: "",
      licenseExpiry: "",
      contactNumber: "",
      email: "",
      address: "",
      emergencyContactName: "",
      emergencyContactNumber: "",
      joiningDate: new Date().toISOString().split("T")[0],
      safetyScore: 100,
      experience: 0,
      region: "",
      status: "Available" as const,
      remarks: "",
    })
    setIsFormOpen(true)
  }

  const openEditModal = (driver: DriverData) => {
    setEditingDriver(driver)
    reset({
      fullName: driver.fullName,
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split("T")[0] : "",
      contactNumber: driver.contactNumber,
      email: driver.email || "",
      address: driver.address || "",
      emergencyContactName: driver.emergencyContactName || "",
      emergencyContactNumber: driver.emergencyContactNumber || "",
      joiningDate: driver.joiningDate ? new Date(driver.joiningDate).toISOString().split("T")[0] : "",
      safetyScore: driver.safetyScore,
      experience: driver.experience,
      region: driver.region || "",
      status: driver.status,
      remarks: driver.remarks || "",
    })
    setIsFormOpen(true)
  }

  const openSafetyModal = (driver: DriverData) => {
    setSafetyDriver(driver)
    resetSafety({
      safetyScore: driver.safetyScore,
      status: driver.status,
    })
    setIsSafetyOpen(true)
  }

  const openDeleteModal = (driver: DriverData) => {
    setDeletingId(driver._id!)
    setDeletingName(driver.fullName)
    setIsDeleteOpen(true)
  }

  const closeFormModal = () => {
    setIsFormOpen(false)
    setEditingDriver(null)
  }

  const closeSafetyModal = () => {
    setIsSafetyOpen(false)
    setSafetyDriver(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteOpen(false)
    setDeletingId(null)
    setDeletingName("")
  }

  // Handle standard Form submission
  const onFormSubmit = (values: z.infer<typeof driverFormSchema>) => {
    // Process email
    const processedValues = {
      ...values,
      email: values.email === "" ? undefined : values.email,
      emergencyContactNumber: values.emergencyContactNumber === "" ? undefined : values.emergencyContactNumber,
    }

    if (editingDriver) {
      updateMutation.mutate({ id: editingDriver._id!, data: processedValues })
    } else {
      createMutation.mutate(processedValues)
    }
  }

  // Handle Safety Form submission
  const onSafetySubmit = (values: z.infer<typeof safetyFormSchema>) => {
    if (safetyDriver) {
      safetyMutation.mutate({
        id: safetyDriver._id!,
        score: values.safetyScore,
        status: values.status,
      })
    }
  }

  // Reset all filters
  const resetFilters = () => {
    setSearch("")
    setStatusFilter("")
    setRegionFilter("")
    setCategoryFilter("")
    setScoreRangeFilter("")
    setExpiringSoonFilter(false)
    setSortBy("createdAt")
    setSortOrder("desc")
    setPage(1)
  }

  // Toggle sorting logic
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
    setPage(1)
  }

  // Utility: Date formatter
  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Utility: Monitor license expiry and returning badge classes
  const getLicenseCompliance = (expiryStr: string | Date) => {
    const expiry = new Date(expiryStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    if (expiry < today) {
      return {
        label: "Expired",
        style: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/50",
        alert: true,
      }
    } else if (expiry <= thirtyDaysFromNow) {
      return {
        label: "Expiring Soon",
        style: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/50",
        alert: true,
      }
    } else {
      return {
        label: "Active",
        style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/50",
        alert: false,
      }
    }
  }

  // Utility: Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/30"
      case "On Trip":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/30"
      case "Off Duty":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400 border border-slate-200/30"
      case "Suspended":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/30"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400"
    }
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Drivers Directory</h1>
          <p className="text-muted-foreground mt-1">Manage personnel registry, compliance monitor, license tracking, and safety scoring.</p>
        </div>
        {isManager && (
          <Button onClick={openAddModal} className="flex items-center gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4.5 w-4.5" /> Add Driver Profile
          </Button>
        )}
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search drivers by name, employee ID, license number, or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-background border border-border/80 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
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

            {/* Quick Actions (Reset Filters) */}
            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs flex items-center gap-1.5 h-9">
                <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
              </Button>
            </div>
          </div>

          {/* ADVANCED MULTI-FILTERS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-1 border-t border-border/40">
            
            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Duty Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="Off Duty">Off Duty</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {/* Region Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Region</label>
              <input
                type="text"
                placeholder="e.g. Northeast"
                value={regionFilter}
                onChange={(e) => {
                  setRegionFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
              />
            </div>

            {/* License Class Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">License Class</label>
              <input
                type="text"
                placeholder="e.g. Class A CDL"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
              />
            </div>

            {/* Safety Score Rating Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Safety Rating</label>
              <select
                value={scoreRangeFilter}
                onChange={(e) => {
                  setScoreRangeFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All Ratings</option>
                <option value="high">Excellent (90-100)</option>
                <option value="medium">Satisfactory (75-89)</option>
                <option value="critical">Critical (&lt;75)</option>
              </select>
            </div>

            {/* Compliance Expiring Soon */}
            <div className="flex items-center gap-2 pt-5 select-none sm:col-span-2 lg:col-span-1">
              <input
                type="checkbox"
                id="expiringSoon"
                checked={expiringSoonFilter}
                onChange={(e) => {
                  setExpiringSoonFilter(e.target.checked)
                  setPage(1)
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="expiringSoon" className="text-xs font-bold text-muted-foreground cursor-pointer flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-500" /> Expiry Soon (&lt;30d)
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LOADER / ERROR STATES */}
      {isLoading && (
        <Card className="border-border/60 p-12">
          <Loading size="lg" label="Synchronizing driver directory..." />
        </Card>
      )}

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5 p-8 text-center text-destructive">
          <AlertCircle className="h-10 w-10 mx-auto mb-3" />
          <h3 className="font-bold text-lg">Error Syncing Database</h3>
          <p className="text-sm mt-1 text-muted-foreground">Could not connect to directory server. Please check MongoDB connection.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4 border-destructive/20 hover:bg-destructive/10 text-destructive">
            Retry Connection
          </Button>
        </Card>
      )}

      {/* DRIVERS DATATABLE CARD */}
      {!isLoading && !isError && data && (
        <Card className="border-border/60 shadow-sm overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-extrabold tracking-wider border-b border-border/40">
                <tr>
                  <th className="p-4 font-bold">Employee ID</th>
                  <th className="p-4 cursor-pointer hover:bg-muted/60 transition-colors" onClick={() => handleSort("fullName")}>
                    <div className="flex items-center gap-1.5">
                      Driver Name
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    </div>
                  </th>
                  <th className="p-4 font-bold">License Number</th>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 cursor-pointer hover:bg-muted/60 transition-colors text-center" onClick={() => handleSort("safetyScore")}>
                    <div className="flex items-center justify-center gap-1.5">
                      Safety Score
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    </div>
                  </th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 cursor-pointer hover:bg-muted/60 transition-colors" onClick={() => handleSort("licenseExpiry")}>
                    <div className="flex items-center gap-1.5">
                      License Expiry
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    </div>
                  </th>
                  <th className="p-4 font-bold">Contact</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.data.drivers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-muted-foreground">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Info className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <h4 className="font-bold text-foreground/80">No Drivers Found</h4>
                        <p className="text-xs">Try adjusting your filters, query text, or add a new driver profile.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.data.drivers.map((driver) => {
                    const comp = getLicenseCompliance(driver.licenseExpiry);
                    return (
                      <tr key={driver._id} className="hover:bg-muted/15 transition-colors group">
                        <td className="p-4 font-mono font-bold text-xs text-foreground/90">
                          {driver.employeeId || "PENDING"}
                        </td>
                        <td className="p-4">
                          <Link to={`/drivers/${driver._id}`} className="font-semibold text-foreground/95 hover:text-primary transition-colors flex items-center gap-2">
                            {driver.fullName}
                          </Link>
                          {driver.region && (
                            <span className="text-[10px] text-muted-foreground block mt-0.5">{driver.region} Region</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-xs font-semibold uppercase">{driver.licenseNumber}</td>
                        <td className="p-4 font-medium text-muted-foreground text-xs">{driver.licenseCategory}</td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary/5 text-primary text-xs font-bold ring-1 ring-primary/10">
                            <Award className="h-3.5 w-3.5" />
                            {driver.safetyScore}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(driver.status)}`}>
                            {driver.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${comp.style}`}>
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            {formatDate(driver.licenseExpiry)}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-medium text-muted-foreground">
                          {driver.contactNumber}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* View Profile */}
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/drivers/${driver._id}`)} className="h-8 w-8 p-0" title="View Details">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>

                            {/* Compliance Patch (Safety Officer + Manager) */}
                            {canEditSafety && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openSafetyModal(driver)}
                                className="h-8 w-8 p-0"
                                title="Safety & Duty Status Check"
                              >
                                <ShieldAlert className="h-4 w-4 text-amber-500/80" />
                              </Button>
                            )}

                            {/* Full Edit (Manager Only) */}
                            {canEditFull && (
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(driver)} className="h-8 w-8 p-0" title="Edit Profile">
                                <Edit2 className="h-4 w-4 text-primary/80" />
                              </Button>
                            )}

                            {/* Full Delete (Manager Only) */}
                            {canEditFull && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(driver)}
                                className="h-8 w-8 p-0 hover:bg-destructive/10"
                                title="Delete Profile"
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

      {/* --- ADD / EDIT DRIVER FORM MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col scale-100 transition-all duration-300">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {editingDriver ? `Edit Driver Profile (${editingDriver.employeeId})` : "Register New Driver Profile"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete professional qualifications, license details, and contact points.
                </p>
              </div>
              <button
                onClick={closeFormModal}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
              
              {/* Expired License Warning in Form */}
              {editingDriver && new Date(editingDriver.licenseExpiry) < new Date() && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-800 dark:text-rose-300 leading-normal">
                    <strong>Expired License Compliance Alert:</strong> This driver's license is expired. By business safety policy, they cannot set status to <strong>Available</strong> until license expiry is updated to a future date.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Full Name *</label>
                  <input
                    type="text"
                    {...register("fullName")}
                    placeholder="e.g. John Doe"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {formErrors.fullName && (
                    <p className="text-xs text-destructive font-medium">{formErrors.fullName.message}</p>
                  )}
                </div>

                {/* License Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">License Number *</label>
                  <input
                    type="text"
                    {...register("licenseNumber")}
                    placeholder="e.g. DL-9928372"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary uppercase"
                  />
                  {formErrors.licenseNumber && (
                    <p className="text-xs text-destructive font-medium">{formErrors.licenseNumber.message}</p>
                  )}
                </div>

                {/* License Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">License Class/Category *</label>
                  <input
                    type="text"
                    {...register("licenseCategory")}
                    placeholder="e.g. Class A CDL"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {formErrors.licenseCategory && (
                    <p className="text-xs text-destructive font-medium">{formErrors.licenseCategory.message}</p>
                  )}
                </div>

                {/* License Expiry Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">License Expiry Date *</label>
                  <input
                    type="date"
                    {...register("licenseExpiry")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {formErrors.licenseExpiry && (
                    <p className="text-xs text-destructive font-medium">{formErrors.licenseExpiry.message}</p>
                  )}
                </div>

                {/* Contact Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Contact Phone Number *</label>
                  <input
                    type="text"
                    {...register("contactNumber")}
                    placeholder="e.g. +1 555-0100"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {formErrors.contactNumber && (
                    <p className="text-xs text-destructive font-medium">{formErrors.contactNumber.message}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="e.g. driver@transitops.com"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {formErrors.email && (
                    <p className="text-xs text-destructive font-medium">{formErrors.email.message}</p>
                  )}
                </div>

                {/* Experience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Experience (Years)</label>
                  <input
                    type="number"
                    {...register("experience")}
                    placeholder="e.g. 5"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {formErrors.experience && (
                    <p className="text-xs text-destructive font-medium">{formErrors.experience.message}</p>
                  )}
                </div>

                {/* Region */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Assigned operating Region</label>
                  <input
                    type="text"
                    {...register("region")}
                    placeholder="e.g. Midwest"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                {/* Emergency Contact Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Emergency Contact Name</label>
                  <input
                    type="text"
                    {...register("emergencyContactName")}
                    placeholder="e.g. Spouse/Sibling Name"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                {/* Emergency Contact Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Emergency Contact Number</label>
                  <input
                    type="text"
                    {...register("emergencyContactNumber")}
                    placeholder="e.g. +1 555-0999"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {formErrors.emergencyContactNumber && (
                    <p className="text-xs text-destructive font-medium">{formErrors.emergencyContactNumber.message}</p>
                  )}
                </div>

                {/* Joining Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Joining Date</label>
                  <input
                    type="date"
                    {...register("joiningDate")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                {/* Safety Score */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Initial Safety Score (0-100)</label>
                  <input
                    type="number"
                    {...register("safetyScore")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {formErrors.safetyScore && (
                    <p className="text-xs text-destructive font-medium">{formErrors.safetyScore.message}</p>
                  )}
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Duty Status *</label>
                  <select
                    {...register("status")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {/* Physical/Mailing Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Residential Address</label>
                  <input
                    type="text"
                    {...register("address")}
                    placeholder="e.g. 100 Main St, Dallas, TX"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                {/* Remarks/Compliance notes */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Remarks & Compliance Audit notes</label>
                  <textarea
                    {...register("remarks")}
                    rows={3}
                    placeholder="Provide details about performance track, verification status, or warning flags..."
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
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
                  {editingDriver ? "Save Updates" : "Register Profile"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SAFETY OFFICER DIRECT ACTION DIALOG --- */}
      {isSafetyOpen && safetyDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md scale-100 transition-all duration-300">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Safety Status Compliance Check</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Officer action for: <span className="font-semibold text-foreground">{safetyDriver.fullName}</span>
                </p>
              </div>
              <button
                onClick={closeSafetyModal}
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
                  <Award className="h-3.5 w-3.5 text-primary" /> Safety Score (0-100) *
                </label>
                <input
                  type="number"
                  {...registerSafety("safetyScore")}
                  defaultValue={safetyDriver.safetyScore}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary font-bold"
                />
                {safetyErrors.safetyScore && (
                  <p className="text-xs text-destructive font-medium">{safetyErrors.safetyScore.message}</p>
                )}
              </div>

              {/* Status Update */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Duty Status Check *
                </label>
                <select
                  {...registerSafety("status")}
                  defaultValue={safetyDriver.status}
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
              <div className="p-3 bg-muted/60 border border-border/80 rounded-lg space-y-1.5 text-xs text-muted-foreground leading-normal">
                <p>&bull; Suspended status restricts driver assignment to any active Trip.</p>
                <p>&bull; If the driver's license is expired, status cannot be updated to <strong>Available</strong>.</p>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-border/40 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeSafetyModal}>
                  Close
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

      {/* --- CONFIRM DELETE DIALOG --- */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md scale-100 transition-all duration-300">
            <div className="p-6 space-y-4 text-center">
              <div className="h-12 w-12 bg-destructive/15 rounded-full flex items-center justify-center text-destructive mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">Confirm Profile Deletion</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Are you sure you want to permanently delete driver <span className="font-semibold text-foreground">{deletingName}</span>?
                  This action is irreversible and will remove all operating registry.
                </p>
              </div>
              
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-lg text-left text-xs text-rose-800 dark:text-rose-300 leading-normal">
                <strong>Business Policy Restriction:</strong> Deletion is only permitted if the driver's status is <strong>Available</strong> or <strong>Off Duty</strong>. If currently On Trip or Suspended, the server will block deletion.
              </div>

              <div className="pt-3 flex gap-3 justify-center">
                <Button variant="outline" onClick={closeDeleteModal}>
                  Cancel Action
                </Button>
                <Button
                  onClick={() => deleteMutation.mutate(deletingId!)}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center gap-1.5 shadow-lg shadow-rose-500/15"
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
