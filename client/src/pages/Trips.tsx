import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import tripService, { type TripData, type FetchTripsParams, type CompleteTripData } from "@/services/tripService"
import vehicleService, { type VehicleData } from "@/services/vehicleService"
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
  Route,
  AlertTriangle,
  Play,
  CheckCircle,
  XCircle,
  RotateCcw,
} from "lucide-react"

// Zod validation schema for Trip Form (Create / Edit)
const tripFormSchema = z.object({
  source: z.string().min(1, "Source location is required"),
  destination: z.string().min(1, "Destination location is required"),
  vehicle: z.string().min(1, "Vehicle assignment is required"),
  driver: z.string().min(1, "Driver assignment is required"),
  cargoWeight: z.coerce.number().min(0, "Cargo weight cannot be negative"),
  plannedDistance: z.coerce.number().gt(0, "Planned distance must be greater than zero"),
  estimatedRevenue: z.coerce.number().min(0, "Estimated revenue cannot be negative"),
  plannedStartDate: z.string().min(1, "Planned start date is required"),
  expectedCompletionDate: z.string().optional().default(""),
  startingOdometer: z.coerce.number().min(0, "Starting odometer cannot be negative"),
  remarks: z.string().optional().default(""),
}).refine((data) => data.source.trim().toLowerCase() !== data.destination.trim().toLowerCase(), {
  message: "Source cannot equal Destination",
  path: ["destination"],
})

// Zod validation schema for Completion Form
const completionFormSchema = z.object({
  endingOdometer: z.coerce.number().min(0, "Ending odometer cannot be negative"),
  actualDistance: z.coerce.number().min(0, "Actual distance cannot be negative"),
  fuelConsumed: z.coerce.number().min(0, "Fuel consumed cannot be negative"),
  completionRemarks: z.string().optional().default(""),
  completedDate: z.string().optional().default(""),
})

// Zod validation schema for Cancellation Form
const cancellationFormSchema = z.object({
  cancellationReason: z.string().min(1, "Cancellation reason is required"),
})

export default function Trips() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isDispatcherOrManager = user?.role === "Fleet Manager" || user?.role === "Dispatcher"

  // Search, Filters & Pagination State
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [statusFilter, setStatusFilter] = useState("")
  const [vehicleFilter, setVehicleFilter] = useState("")
  const [driverFilter, setDriverFilter] = useState("")
  const [startDateFilter, setStartDateFilter] = useState("")
  const [endDateFilter, setEndDateFilter] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<TripData | null>(null)
  
  const [isDispatchOpen, setIsDispatchOpen] = useState(false)
  const [dispatchId, setDispatchId] = useState<string | null>(null)
  const [dispatchNum, setDispatchNum] = useState("")

  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const [completeId, setCompleteId] = useState<string | null>(null)
  const [completeNum, setCompleteNum] = useState("")
  const [completeStartOdo, setCompleteStartOdo] = useState(0)

  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelNum, setCancelNum] = useState("")

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingNum, setDeletingNum] = useState("")

  // Fetch Available Vehicles for form dropdown (Available status)
  const { data: availableVehiclesData } = useQuery({
    queryKey: ["available-vehicles"],
    queryFn: () => vehicleService.getVehicles({ limit: 100, status: "Available" }),
    enabled: isFormOpen,
  })
  
  // Fetch Available Drivers for form dropdown
  const { data: availableDriversData } = useQuery({
    queryKey: ["available-drivers"],
    queryFn: () => tripService.getAvailableDrivers(),
    enabled: isFormOpen,
  })

  // Construct search params
  const fetchParams: FetchTripsParams = {
    page,
    limit,
    search: search || undefined,
    status: statusFilter || undefined,
    vehicle: vehicleFilter || undefined,
    driver: driverFilter || undefined,
    startDate: startDateFilter || undefined,
    endDate: endDateFilter || undefined,
    sortBy,
    sortOrder,
  }

  // React Query: Fetch Trips
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["trips", fetchParams],
    queryFn: () => tripService.getTrips(fetchParams),
  })

  // React Query Mutations
  const createMutation = useMutation({
    mutationFn: tripService.createTrip,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] })
      toast.success("Draft Created", {
        description: `Trip ${res.data.tripNumber} has been saved as Draft.`,
      })
      closeFormModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to create trip."
      toast.error("Creation Error", { description: msg })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TripData> }) =>
      tripService.updateTrip(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] })
      toast.success("Trip Updated", {
        description: `Trip ${res.data.tripNumber} has been updated.`,
      })
      closeFormModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to update trip."
      toast.error("Update Error", { description: msg })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: tripService.deleteTrip,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] })
      toast.success("Deletion Successful", {
        description: res.message || "Trip has been deleted.",
      })
      closeDeleteModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to delete trip."
      toast.error("Deletion Blocked", { description: msg })
    },
  })

  const dispatchMutation = useMutation({
    mutationFn: tripService.dispatchTrip,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] })
      toast.success("Trip Dispatched", {
        description: `Trip ${res.data.tripNumber} is now active. Vehicle and driver status set to On Trip.`,
      })
      closeDispatchModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to dispatch trip."
      toast.error("Dispatch Blocked", { description: msg })
    },
  })

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteTripData }) =>
      tripService.completeTrip(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] })
      toast.success("Trip Completed", {
        description: `Trip ${res.data.tripNumber} is completed. Vehicle and driver are now Available.`,
      })
      closeCompleteModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to complete trip."
      toast.error("Completion Mismatch", { description: msg })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { cancellationReason: string } }) =>
      tripService.cancelTrip(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] })
      toast.success("Trip Cancelled", {
        description: `Trip ${res.data.tripNumber} has been cancelled.`,
      })
      closeCancelModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to cancel trip."
      toast.error("Cancellation Error", { description: msg })
    },
  })

  // Trip Edit/Create Form hooks
  const {
    register: registerTrip,
    handleSubmit: handleTripSubmit,
    reset: resetTrip,
    setValue: setTripValue,
    formState: { errors: tripErrors, isSubmitting: isTripSubmitting },
  } = useForm({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      source: "",
      destination: "",
      vehicle: "",
      driver: "",
      cargoWeight: 0,
      plannedDistance: 100,
      estimatedRevenue: 0,
      plannedStartDate: "",
      expectedCompletionDate: "",
      startingOdometer: 0,
      remarks: "",
    },
  })

  const vehiclesDropdown = availableVehiclesData?.data?.vehicles || []
  const driversDropdown = availableDriversData?.data || []

  const handleVehicleChange = (vId: string) => {
    const selectedVeh = vehiclesDropdown.find((v) => v._id === vId)
    if (selectedVeh) {
      setTripValue("startingOdometer", selectedVeh.currentOdometer)
    }
  }

  // Completion Form hooks
  const {
    register: registerComplete,
    handleSubmit: handleCompleteSubmit,
    reset: resetComplete,
    formState: { errors: completeErrors, isSubmitting: isCompleteSubmitting },
  } = useForm({
    resolver: zodResolver(completionFormSchema),
    defaultValues: {
      endingOdometer: 0,
      actualDistance: 0,
      fuelConsumed: 0,
      completionRemarks: "",
      completedDate: "",
    },
  })

  // Cancellation Form hooks
  const {
    register: registerCancel,
    handleSubmit: handleCancelSubmit,
    reset: resetCancel,
    formState: { errors: cancelErrors, isSubmitting: isCancelSubmitting },
  } = useForm({
    resolver: zodResolver(cancellationFormSchema),
    defaultValues: {
      cancellationReason: "",
    },
  })

  const openAddModal = () => {
    setEditingTrip(null)
    resetTrip({
      source: "",
      destination: "",
      vehicle: "",
      driver: "",
      cargoWeight: 0,
      plannedDistance: 100,
      estimatedRevenue: 0,
      plannedStartDate: "",
      expectedCompletionDate: "",
      startingOdometer: 0,
      remarks: "",
    })
    setIsFormOpen(true)
  }

  const openEditModal = (trip: TripData) => {
    setEditingTrip(trip)
    
    const formatDate = (dateStr?: string | Date) => {
      if (!dateStr) return ""
      const d = new Date(dateStr)
      return d.toISOString().split("T")[0]
    }

    const vehId = typeof trip.vehicle === "string" ? trip.vehicle : trip.vehicle?._id || ""
    const drvId = typeof trip.driver === "string" ? trip.driver : trip.driver?._id || ""

    resetTrip({
      source: trip.source,
      destination: trip.destination,
      vehicle: vehId,
      driver: drvId,
      cargoWeight: trip.cargoWeight,
      plannedDistance: trip.plannedDistance || 0,
      estimatedRevenue: trip.estimatedRevenue || 0,
      plannedStartDate: formatDate(trip.plannedStartDate),
      expectedCompletionDate: formatDate(trip.expectedCompletionDate),
      startingOdometer: trip.startingOdometer,
      remarks: trip.remarks || "",
    })
    setIsFormOpen(true)
  }

  const closeFormModal = () => {
    setIsFormOpen(false)
    setEditingTrip(null)
  }

  // Dispatch lifecycle dialog
  const openDispatchModal = (id: string, num: string) => {
    setDispatchId(id)
    setDispatchNum(num)
    setIsDispatchOpen(true)
  }

  const closeDispatchModal = () => {
    setDispatchId(null)
    setDispatchNum("")
    setIsDispatchOpen(false)
  }

  // Complete lifecycle dialog
  const openCompleteModal = (id: string, num: string, startOdo: number) => {
    setCompleteId(id)
    setCompleteNum(num)
    setCompleteStartOdo(startOdo)
    resetComplete({
      endingOdometer: startOdo + 100, // Pre-fill with starting odo + 100 as helper default
      actualDistance: 100,
      fuelConsumed: 25,
      completionRemarks: "",
      completedDate: new Date().toISOString().split("T")[0],
    })
    setIsCompleteOpen(true)
  }

  const closeCompleteModal = () => {
    setCompleteId(null)
    setCompleteNum("")
    setCompleteStartOdo(0)
    setIsCompleteOpen(false)
  }

  // Cancel lifecycle dialog
  const openCancelModal = (id: string, num: string) => {
    setCancelId(id)
    setCancelNum(num)
    resetCancel({ cancellationReason: "" })
    setIsCancelOpen(true)
  }

  const closeCancelModal = () => {
    setCancelId(null)
    setCancelNum("")
    setIsCancelOpen(false)
  }

  // Delete dialog
  const openDeleteModal = (id: string, num: string) => {
    setDeletingId(id)
    setDeletingNum(num)
    setIsDeleteOpen(true)
  }

  const closeDeleteModal = () => {
    setDeletingId(null)
    setDeletingNum("")
    setIsDeleteOpen(false)
  }

  // Submits
  const onTripFormSubmit = (values: any) => {
    // If vehicle capacity validation check fails, warn frontend
    const selectedVeh = vehiclesDropdown.find((v) => v._id === values.vehicle)
    if (selectedVeh && values.cargoWeight > (selectedVeh.maximumLoadCapacity || 0)) {
      toast.error("Cargo Weight Limit Exceeded", {
        description: `Cargo weight exceeds vehicle maximum capacity (${selectedVeh.maximumLoadCapacity} kg).`,
      })
      return
    }

    if (editingTrip && editingTrip._id) {
      updateMutation.mutate({ id: editingTrip._id, data: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const onCompleteSubmit = (values: any) => {
    if (values.endingOdometer < completeStartOdo) {
      toast.error("Validation Mismatch", {
        description: `Ending odometer (${values.endingOdometer} km) cannot be less than starting odometer (${completeStartOdo} km).`,
      })
      return
    }
    if (completeId) {
      completeMutation.mutate({ id: completeId, data: values })
    }
  }

  const onCancelSubmit = (values: any) => {
    if (cancelId) {
      cancelMutation.mutate({ id: cancelId, data: values })
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
    setPage(1)
  }

  const handleResetFilters = () => {
    setSearch("")
    setStatusFilter("")
    setVehicleFilter("")
    setDriverFilter("")
    setStartDateFilter("")
    setEndDateFilter("")
    setSortBy("createdAt")
    setSortOrder("desc")
    setPage(1)
  }

  const responseData = data?.data
  const trips = responseData?.trips || []
  const pagination = responseData?.pagination || { total: 0, page: 1, limit: 10, pages: 1 }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground/90">Trip Dispatch Panel</h1>
          <p className="text-muted-foreground mt-1">Dispatch routes, track transport lifecycles, and synchronize driver/vehicle availability.</p>
        </div>
        {isDispatcherOrManager && (
          <Button onClick={openAddModal} className="flex items-center gap-2 self-start sm:self-auto shadow-md">
            <Plus className="h-4 w-4" /> Book Route / Trip
          </Button>
        )}
      </div>

      {/* SEARCH AND FILTERS */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
          {/* Search bar */}
          <div className="sm:col-span-2 relative space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground text-left block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search trip no, source, vehicle, driver..."
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Start Date range filter */}
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">From Date</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value)
                setPage(1)
              }}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none"
            />
          </div>

          {/* End Date range filter */}
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">To Date</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value)
                setPage(1)
              }}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none"
            />
          </div>

          {/* Reset Filters */}
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 h-10 w-full"
            title="Reset Filters"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </CardContent>
      </Card>

      {/* MAIN DATA SECTION */}
      {isLoading ? (
        <Card className="border-border/60 p-12">
          <Loading size="lg" label="Retrieving dispatcher logs..." />
        </Card>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive p-8 text-center rounded-xl">
          <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
          <h3 className="font-bold text-lg">Dispatcher Logs Unavailable</h3>
          <p className="text-sm opacity-80 mt-1">Check your connection or credentials and try reloading.</p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            Reload Logs
          </Button>
        </Card>
      ) : trips.length === 0 ? (
        <Card className="border-border/60 p-16 text-center rounded-xl bg-card">
          <Route className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground/80">No Active Trips Found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
            No transit logs match your query. Set up route bookings to dispatch trucks.
          </p>
          {isDispatcherOrManager && (
            <Button onClick={openAddModal} className="mt-6">
              Create Trip
            </Button>
          )}
        </Card>
      ) : (
        /* DISPATCH LOG TABLE */
        <Card className="border-border/60 shadow-sm bg-card overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("tripNumber")}>
                    <div className="flex items-center gap-1">
                      Trip No
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold">Route</th>
                  <th className="p-4 font-semibold">Vehicle</th>
                  <th className="p-4 font-semibold">Driver</th>
                  <th className="p-4 font-semibold">Cargo (Kg)</th>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("plannedDistance")}>
                    <div className="flex items-center gap-1">
                      Distance
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("plannedStartDate")}>
                    <div className="flex items-center gap-1">
                      Start Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {trips.map((trip) => {
                  const veh = trip.vehicle as VehicleData | undefined
                  const drv = trip.driver as { fullName: string; licenseNumber: string } | undefined
                  return (
                    <tr key={trip._id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <Link
                          to={`/trips/${trip._id}`}
                          className="font-mono font-bold text-primary hover:underline hover:text-primary/80"
                        >
                          {trip.tripNumber}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-semibold">{trip.source}</div>
                        <div className="text-xs text-muted-foreground">to {trip.destination}</div>
                      </td>
                      <td className="p-4">
                        {veh ? (
                          <div className="font-mono text-xs font-bold text-foreground/80">
                            {veh.registrationNumber}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-4">
                        {drv ? (
                          <div className="text-xs font-semibold text-foreground/80">{drv.fullName}</div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-4 font-mono text-xs">{trip.cargoWeight.toLocaleString()} kg</td>
                      <td className="p-4 text-xs font-medium">
                        {trip.status === "Completed" ? (
                          <span>{trip.actualDistance?.toLocaleString()} km (act)</span>
                        ) : (
                          <span>{trip.plannedDistance?.toLocaleString()} km (est)</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(trip.plannedStartDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          trip.status === "Draft" ? "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400" :
                          trip.status === "Dispatched" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" :
                          trip.status === "Completed" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" :
                          "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400"
                        }`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/trips/${trip._id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="View details">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </Link>

                          {isDispatcherOrManager && (
                            <>
                              {/* Dispatch trigger */}
                              {trip.status === "Draft" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDispatchModal(trip._id!, trip.tripNumber!)}
                                  className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-600"
                                  title="Dispatch trip"
                                >
                                  <Play className="h-4 w-4 text-blue-500" />
                                </Button>
                              )}

                              {/* Complete trigger */}
                              {trip.status === "Dispatched" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openCompleteModal(trip._id!, trip.tripNumber!, trip.startingOdometer)}
                                  className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-600"
                                  title="Complete trip"
                                >
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                </Button>
                              )}

                              {/* Cancel trigger */}
                              {(trip.status === "Draft" || trip.status === "Dispatched") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openCancelModal(trip._id!, trip.tripNumber!)}
                                  className="h-8 w-8 hover:bg-amber-500/10 hover:text-amber-600"
                                  title="Cancel trip"
                                >
                                  <XCircle className="h-4 w-4 text-amber-500" />
                                </Button>
                              )}

                              {/* Edit trigger */}
                              {trip.status === "Draft" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditModal(trip)}
                                  className="h-8 w-8"
                                  title="Edit trip"
                                >
                                  <Edit2 className="h-4 w-4 text-blue-500" />
                                </Button>
                              )}

                              {/* Delete trigger */}
                              {(trip.status === "Draft" || trip.status === "Cancelled") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteModal(trip._id!, trip.tripNumber!)}
                                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                  title="Delete trip"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>

          {/* TABLE PAGINATION FOOTER */}
          <div className="p-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
                className="bg-background border border-border rounded p-1 text-xs focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs text-muted-foreground">
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, pagination.total)} of {pagination.total} records
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
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pNum) => (
                <Button
                  key={pNum}
                  variant={pNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pNum)}
                  className="h-8 w-8 p-0"
                >
                  {pNum}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                disabled={page === pagination.pages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* --- ADD / EDIT TRIP DIALOG MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {editingTrip ? `Edit Trip Details (${editingTrip.tripNumber})` : "Book New Cargo Route / Trip"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete required route specs and assign Available fleet resources.
                </p>
              </div>
              <button
                onClick={closeFormModal}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <form onSubmit={handleTripSubmit(onTripFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Source */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Source Hub*</label>
                  <input
                    type="text"
                    {...registerTrip("source")}
                    placeholder="e.g. Dallas Central Depot"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {tripErrors.source && (
                    <p className="text-xs text-destructive font-medium">{tripErrors.source.message}</p>
                  )}
                </div>

                {/* Destination */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Destination Hub*</label>
                  <input
                    type="text"
                    {...registerTrip("destination")}
                    placeholder="e.g. Houston Cargo Port"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {tripErrors.destination && (
                    <p className="text-xs text-destructive font-medium">{tripErrors.destination.message}</p>
                  )}
                </div>

                {/* Vehicle Selector (Available only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Assign Available Vehicle*</label>
                  <select
                    {...registerTrip("vehicle")}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  >
                    <option value="">Select Available Vehicle</option>
                    {/* If editing, append current trip vehicle to select options */}
                    {editingTrip && typeof editingTrip.vehicle !== "string" && editingTrip.vehicle && (
                      <option key={editingTrip.vehicle._id} value={editingTrip.vehicle._id}>
                        {editingTrip.vehicle.registrationNumber} ({editingTrip.vehicle.vehicleName}) — Currently assigned
                      </option>
                    )}
                    {vehiclesDropdown
                      .filter((v) => editingTrip === null || (typeof editingTrip.vehicle === "string" ? editingTrip.vehicle : editingTrip.vehicle?._id) !== v._id)
                      .map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.registrationNumber} ({v.vehicleName}) — Odo: {v.currentOdometer.toLocaleString()} km
                        </option>
                      ))}
                  </select>
                  {tripErrors.vehicle && (
                    <p className="text-xs text-destructive font-medium">{tripErrors.vehicle.message}</p>
                  )}
                </div>

                {/* Driver Selector (Available only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Assign Available Driver*</label>
                  <select
                    {...registerTrip("driver")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  >
                    <option value="">Select Available Driver</option>
                    {/* If editing, append current trip driver to select options */}
                    {editingTrip && typeof editingTrip.driver !== "string" && editingTrip.driver && (
                      <option key={editingTrip.driver._id} value={editingTrip.driver._id}>
                        {editingTrip.driver.fullName} (DL: {editingTrip.driver.licenseNumber}) — Currently assigned
                      </option>
                    )}
                    {driversDropdown
                      .filter((d) => editingTrip === null || (typeof editingTrip.driver === "string" ? editingTrip.driver : editingTrip.driver?._id) !== d._id)
                      .map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.fullName} (DL: {d.licenseNumber}) &bull; Category: {d.licenseCategory}
                        </option>
                      ))}
                  </select>
                  {tripErrors.driver && (
                    <p className="text-xs text-destructive font-medium">{tripErrors.driver.message}</p>
                  )}
                </div>

                {/* Cargo Weight */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Cargo Weight (Kg)*</label>
                  <input
                    type="number"
                    {...registerTrip("cargoWeight")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {tripErrors.cargoWeight && (
                    <p className="text-xs text-destructive font-medium">{tripErrors.cargoWeight.message}</p>
                  )}
                </div>

                {/* Planned Distance */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Planned Distance (Km)*</label>
                  <input
                    type="number"
                    {...registerTrip("plannedDistance")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {tripErrors.plannedDistance && (
                    <p className="text-xs text-destructive font-medium">{tripErrors.plannedDistance.message}</p>
                  )}
                </div>

                {/* Starting Odometer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Starting Odometer (Km)*</label>
                  <input
                    type="number"
                    {...registerTrip("startingOdometer")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {tripErrors.startingOdometer && (
                    <p className="text-xs text-destructive font-medium">{tripErrors.startingOdometer.message}</p>
                  )}
                </div>

                {/* Estimated Revenue */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Estimated Revenue ($)*</label>
                  <input
                    type="number"
                    {...registerTrip("estimatedRevenue")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {tripErrors.estimatedRevenue && (
                    <p className="text-xs text-destructive font-medium">{tripErrors.estimatedRevenue.message}</p>
                  )}
                </div>

                {/* Planned Start Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Planned Start Date*</label>
                  <input
                    type="date"
                    {...registerTrip("plannedStartDate")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {tripErrors.plannedStartDate && (
                    <p className="text-xs text-destructive font-medium">{tripErrors.plannedStartDate.message}</p>
                  )}
                </div>

                {/* Expected Completion Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Expected Completion Date</label>
                  <input
                    type="date"
                    {...registerTrip("expectedCompletionDate")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Remarks / Dispatch Notes</label>
                <textarea
                  rows={3}
                  {...registerTrip("remarks")}
                  placeholder="Enter specific route instructions, customer details, or cargo specifications..."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              {/* Modal Actions Footer */}
              <div className="p-4 border-t border-border/40 flex items-center justify-end gap-3 bg-muted/10 -mx-6 -mb-6 mt-6 rounded-b-2xl">
                <Button type="button" variant="outline" onClick={closeFormModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isTripSubmitting}>
                  {isTripSubmitting ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Save Trip"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM DISPATCH MODAL --- */}
      {isDispatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md p-6 text-left">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Play className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Dispatch Trip</h3>
                <p className="text-sm text-muted-foreground">
                  Are you ready to dispatch trip <strong className="font-mono text-foreground">{dispatchNum}</strong>?
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This will immediately set the Trip state to <strong>Dispatched</strong>, and update both the assigned vehicle's and driver's statuses to <strong>On Trip</strong>.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={closeDispatchModal}>
                Cancel
              </Button>
              <Button onClick={() => dispatchMutation.mutate(dispatchId!)} disabled={dispatchMutation.isPending}>
                {dispatchMutation.isPending ? "Dispatching..." : "Confirm Dispatch"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- COMPLETE TRIP DIALOG MODAL --- */}
      {isCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg flex flex-col text-left">
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Complete Trip Logs ({completeNum})</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirm ending odometer, actual route distance, and fuel consumption metrics.
                </p>
              </div>
              <button
                onClick={closeCompleteModal}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit(onCompleteSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Ending Odometer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Ending Odometer (Km)*</label>
                  <input
                    type="number"
                    {...registerComplete("endingOdometer")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Starting Odometer: {completeStartOdo} km</p>
                  {completeErrors.endingOdometer && (
                    <p className="text-xs text-destructive font-medium">{completeErrors.endingOdometer.message}</p>
                  )}
                </div>

                {/* Actual Distance */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Actual Distance Travelled (Km)*</label>
                  <input
                    type="number"
                    {...registerComplete("actualDistance")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {completeErrors.actualDistance && (
                    <p className="text-xs text-destructive font-medium">{completeErrors.actualDistance.message}</p>
                  )}
                </div>

                {/* Fuel Consumed */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Fuel Consumed (Liters)*</label>
                  <input
                    type="number"
                    {...registerComplete("fuelConsumed")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {completeErrors.fuelConsumed && (
                    <p className="text-xs text-destructive font-medium">{completeErrors.fuelConsumed.message}</p>
                  )}
                </div>

                {/* Completion Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Completion Date</label>
                  <input
                    type="date"
                    {...registerComplete("completedDate")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Completion Remarks</label>
                <textarea
                  rows={3}
                  {...registerComplete("completionRemarks")}
                  placeholder="Enter specific route summaries, cargo arrival details, fuel efficiency remarks..."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              {/* Modal Actions Footer */}
              <div className="p-4 border-t border-border/40 flex items-center justify-end gap-3 bg-muted/10 -mx-6 -mb-6 mt-6 rounded-b-2xl">
                <Button type="button" variant="outline" onClick={closeCompleteModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCompleteSubmitting}>
                  {isCompleteSubmitting ? "Saving..." : "Confirm Completion"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CANCEL TRIP DIALOG MODAL --- */}
      {isCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md flex flex-col text-left">
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Cancel Trip ({cancelNum})</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Provide cancellation reason. If dispatched, vehicle & driver are restored to Available.
                </p>
              </div>
              <button
                onClick={closeCancelModal}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit(onCancelSubmit)} className="p-6 space-y-4">
              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Cancellation Reason*</label>
                <textarea
                  rows={3}
                  {...registerCancel("cancellationReason")}
                  placeholder="Enter reason (e.g. client cancellation, vehicle failure, weather delay)..."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
                {cancelErrors.cancellationReason && (
                  <p className="text-xs text-destructive font-medium">{cancelErrors.cancellationReason.message}</p>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="p-4 border-t border-border/40 flex items-center justify-end gap-3 bg-muted/10 -mx-6 -mb-6 mt-6 rounded-b-2xl">
                <Button type="button" variant="outline" onClick={closeCancelModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCancelSubmitting}
                  className="bg-destructive hover:bg-destructive/90 text-white"
                >
                  {isCancelSubmitting ? "Cancelling..." : "Confirm Cancellation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE TRIP MODAL --- */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md p-6 text-left">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Confirm Deletion</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to permanently delete trip <strong className="font-mono text-foreground">{deletingNum}</strong> from the dispatcher logs?
                </p>
                <p className="text-xs text-destructive font-medium bg-destructive/5 p-2 rounded border border-destructive/10 mt-2">
                  Warning: Deletion is only allowed for Draft or Cancelled trips.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={closeDeleteModal}>
                Cancel
              </Button>
              <Button
                onClick={() => deleteMutation.mutate(deletingId!)}
                className="bg-destructive hover:bg-destructive/90 text-white"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Trip"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


