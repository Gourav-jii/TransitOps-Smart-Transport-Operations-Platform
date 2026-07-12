import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import vehicleService, { type VehicleData, type FetchVehiclesParams } from "@/services/vehicleService"
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
  Truck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react"

// Zod validation schema for Vehicle Form
const vehicleFormSchema = z.object({
  registrationNumber: z
    .string()
    .min(1, "Registration number is required"),
  vehicleName: z.string().min(1, "Vehicle name is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  model: z.string().min(1, "Model is required"),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  region: z.string(),
  maximumLoadCapacity: z.coerce.number().gt(0, "Maximum load capacity must be greater than zero"),
  currentOdometer: z.coerce.number().min(0, "Odometer reading cannot be negative"),
  acquisitionCost: z.coerce.number().min(0, "Acquisition cost cannot be negative"),
  purchaseDate: z.string(),
  fuelType: z.string(),
  insuranceExpiry: z.string(),
  fitnessExpiry: z.string(),
  pollutionExpiry: z.string(),
  status: z.enum(["Available", "On Trip", "In Shop", "Retired"]),
  remarks: z.string(),
})

export default function Vehicles() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isManager = user?.role === "Fleet Manager"

  // Search, Pagination, Filters & Sort State
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [regionFilter, setRegionFilter] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<VehicleData | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingReg, setDeletingReg] = useState("")

  // Construct search params
  const fetchParams: FetchVehiclesParams = {
    page,
    limit,
    search: search || undefined,
    status: statusFilter || undefined,
    vehicleType: typeFilter || undefined,
    region: regionFilter || undefined,
    sortBy,
    sortOrder,
  }

  // React Query: Fetch Vehicles
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["vehicles", fetchParams],
    queryFn: () => vehicleService.getVehicles(fetchParams),
  })

  // React Query: Create Mutation
  const createMutation = useMutation({
    mutationFn: vehicleService.createVehicle,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Registration Successful", {
        description: `Vehicle ${res.data.registrationNumber} has been registered.`,
      })
      closeFormModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to create vehicle record."
      toast.error("Registration Error", { description: msg })
    },
  })

  // React Query: Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VehicleData> }) =>
      vehicleService.updateVehicle(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Update Successful", {
        description: `Vehicle ${res.data.registrationNumber} has been updated.`,
      })
      closeFormModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to update vehicle record."
      toast.error("Update Error", { description: msg })
    },
  })

  // React Query: Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: vehicleService.deleteVehicle,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Deletion Successful", {
        description: res.message || "Vehicle has been deleted from the registry.",
      })
      closeDeleteModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to delete vehicle."
      toast.error("Deletion Blocked", { description: msg })
    },
  })

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      registrationNumber: "",
      vehicleName: "",
      manufacturer: "",
      model: "",
      vehicleType: "",
      region: "",
      maximumLoadCapacity: 15000,
      currentOdometer: 0,
      acquisitionCost: 0,
      purchaseDate: "",
      fuelType: "Diesel",
      insuranceExpiry: "",
      fitnessExpiry: "",
      pollutionExpiry: "",
      status: "Available",
      remarks: "",
    },
  })

  const openAddModal = () => {
    setEditingVehicle(null)
    reset({
      registrationNumber: "",
      vehicleName: "",
      manufacturer: "",
      model: "",
      vehicleType: "",
      region: "",
      maximumLoadCapacity: 15000,
      currentOdometer: 0,
      acquisitionCost: 0,
      purchaseDate: "",
      fuelType: "Diesel",
      insuranceExpiry: "",
      fitnessExpiry: "",
      pollutionExpiry: "",
      status: "Available",
      remarks: "",
    })
    setIsFormOpen(true)
  }

  const openEditModal = (vehicle: VehicleData) => {
    setEditingVehicle(vehicle)
    
    // Format dates to YYYY-MM-DD for input tags
    const formatDate = (dateStr?: string | Date) => {
      if (!dateStr) return ""
      const d = new Date(dateStr)
      return d.toISOString().split("T")[0]
    }

    reset({
      registrationNumber: vehicle.registrationNumber,
      vehicleName: vehicle.vehicleName,
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      vehicleType: vehicle.vehicleType,
      region: vehicle.region || "",
      maximumLoadCapacity: vehicle.maximumLoadCapacity || 0,
      currentOdometer: vehicle.currentOdometer,
      acquisitionCost: vehicle.acquisitionCost || 0,
      purchaseDate: formatDate(vehicle.purchaseDate),
      fuelType: vehicle.fuelType || "Diesel",
      insuranceExpiry: formatDate(vehicle.insuranceExpiry),
      fitnessExpiry: formatDate(vehicle.fitnessExpiry),
      pollutionExpiry: formatDate(vehicle.pollutionExpiry),
      status: vehicle.status,
      remarks: vehicle.remarks || "",
    })
    setIsFormOpen(true)
  }

  const closeFormModal = () => {
    setIsFormOpen(false)
    setEditingVehicle(null)
  }

  const openDeleteModal = (id: string, regNo: string) => {
    setDeletingId(id)
    setDeletingReg(regNo)
    setIsDeleteOpen(true)
  }

  const closeDeleteModal = () => {
    setDeletingId(null)
    setDeletingReg("")
    setIsDeleteOpen(false)
  }

  const onFormSubmit = (values: any) => {
    if (editingVehicle && editingVehicle._id) {
      updateMutation.mutate({ id: editingVehicle._id, data: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId)
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
    setTypeFilter("")
    setRegionFilter("")
    setSortBy("createdAt")
    setSortOrder("desc")
    setPage(1)
  }

  const responseData = data?.data
  const vehicles = responseData?.vehicles || []
  const pagination = responseData?.pagination || { total: 0, page: 1, limit: 10, pages: 1 }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground/90">Vehicles Registry</h1>
          <p className="text-muted-foreground mt-1">Register logistics fleet assets, manage regional assignments, and track active statuses.</p>
        </div>
        {isManager && (
          <Button onClick={openAddModal} className="flex items-center gap-2 self-start sm:self-auto shadow-md">
            <Plus className="h-4 w-4" /> Register Vehicle
          </Button>
        )}
      </div>

      {/* FILTER AND SEARCH CONTROLS */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-end">
          {/* Search bar */}
          <div className="relative flex-1 w-full space-y-1">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search plate, vehicle name, model, region..."
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="w-full md:w-44 space-y-1 text-left">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              <option value="">All Types</option>
              <option value="Semi-Truck">Semi-Truck</option>
              <option value="Heavy Duty Truck">Heavy Duty Truck</option>
              <option value="Reefer Truck">Reefer Truck</option>
              <option value="Flatbed Trailer">Flatbed Trailer</option>
              <option value="Light Cargo Van">Light Cargo Van</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-44 space-y-1 text-left">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          {/* Clear Button */}
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 h-10 w-full md:w-auto"
            title="Reset Filters"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </CardContent>
      </Card>

      {/* ERROR AND LOADING STATES */}
      {isLoading ? (
        <Card className="border-border/60 p-12">
          <Loading size="lg" label="Retrieving fleet registry..." />
        </Card>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive p-8 text-center rounded-xl">
          <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-destructive" />
          <h3 className="font-bold text-lg">Failed to Load Fleet Registry</h3>
          <p className="text-sm opacity-80 mt-1">Check your database connection or try reloading the panel.</p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            Try Again
          </Button>
        </Card>
      ) : vehicles.length === 0 ? (
        <Card className="border-border/60 p-16 text-center rounded-xl bg-card">
          <Truck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground/80">No Vehicles Registered</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
            There are no vehicles matching your active filter criteria in the database registry.
          </p>
          {isManager && (
            <Button onClick={openAddModal} className="mt-6">
              Add First Vehicle
            </Button>
          )}
        </Card>
      ) : (
        /* DATA TABLE CARD */
        <Card className="border-border/60 shadow-sm bg-card overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("registrationNumber")}>
                    <div className="flex items-center gap-1">
                      Plate No
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("vehicleName")}>
                    <div className="flex items-center gap-1">
                      Vehicle Name
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold">Model / Brand</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Region</th>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("maximumLoadCapacity")}>
                    <div className="flex items-center gap-1">
                      Max Load
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold">Odometer</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <Link
                        to={`/vehicles/${vehicle._id}`}
                        className="font-mono font-bold text-primary hover:underline hover:text-primary/80"
                      >
                        {vehicle.registrationNumber}
                      </Link>
                    </td>
                    <td className="p-4 font-semibold text-foreground/80">{vehicle.vehicleName}</td>
                    <td className="p-4 text-xs">
                      {vehicle.manufacturer} {vehicle.model}
                    </td>
                    <td className="p-4">{vehicle.vehicleType}</td>
                    <td className="p-4 text-xs text-muted-foreground">{vehicle.region || "—"}</td>
                    <td className="p-4 text-xs font-medium">
                      {vehicle.maximumLoadCapacity ? `${vehicle.maximumLoadCapacity.toLocaleString()} kg` : "—"}
                    </td>
                    <td className="p-4 font-mono text-xs">
                      {vehicle.currentOdometer.toLocaleString()} km
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        vehicle.status === "Available" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" :
                        vehicle.status === "On Trip" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" :
                        vehicle.status === "In Shop" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400" :
                        "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400"
                      }`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/vehicles/${vehicle._id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View details">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </Link>
                        {isManager && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(vehicle)}
                              className="h-8 w-8"
                              title="Edit vehicle"
                            >
                              <Edit2 className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteModal(vehicle._id!, vehicle.registrationNumber)}
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              title="Delete vehicle"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* --- ADD / EDIT VEHICLE MODAL DIALOG --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {editingVehicle ? `Edit Vehicle details (${editingVehicle.registrationNumber})` : "Register New Fleet Vehicle"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete required vehicle specifications and boundary criteria.
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
            <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
              {editingVehicle?.status === "Retired" && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-normal">
                    <strong>Retired Constraints Active:</strong> Since this vehicle's status is retired, database business rules block editing any properties except for remarks.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Registration Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Registration Number (Plate)*</label>
                  <input
                    type="text"
                    {...register("registrationNumber")}
                    disabled={editingVehicle?.status === "Retired"}
                    placeholder="e.g. TX-8829-AB"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  />
                  {errors.registrationNumber && (
                    <p className="text-xs text-destructive font-medium">{errors.registrationNumber.message}</p>
                  )}
                </div>

                {/* Vehicle Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Vehicle Name*</label>
                  <input
                    type="text"
                    {...register("vehicleName")}
                    disabled={editingVehicle?.status === "Retired"}
                    placeholder="e.g. Goliath Semi-Truck"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  />
                  {errors.vehicleName && (
                    <p className="text-xs text-destructive font-medium">{errors.vehicleName.message}</p>
                  )}
                </div>

                {/* Manufacturer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Manufacturer*</label>
                  <input
                    type="text"
                    {...register("manufacturer")}
                    disabled={editingVehicle?.status === "Retired"}
                    placeholder="e.g. Volvo"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  />
                  {errors.manufacturer && (
                    <p className="text-xs text-destructive font-medium">{errors.manufacturer.message}</p>
                  )}
                </div>

                {/* Model */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Model*</label>
                  <input
                    type="text"
                    {...register("model")}
                    disabled={editingVehicle?.status === "Retired"}
                    placeholder="e.g. FH16 Globe"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  />
                  {errors.model && (
                    <p className="text-xs text-destructive font-medium">{errors.model.message}</p>
                  )}
                </div>

                {/* Vehicle Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Vehicle Type*</label>
                  <select
                    {...register("vehicleType")}
                    disabled={editingVehicle?.status === "Retired"}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  >
                    <option value="">Select Type</option>
                    <option value="Semi-Truck">Semi-Truck</option>
                    <option value="Heavy Duty Truck">Heavy Duty Truck</option>
                    <option value="Reefer Truck">Reefer Truck</option>
                    <option value="Flatbed Trailer">Flatbed Trailer</option>
                    <option value="Light Cargo Van">Light Cargo Van</option>
                  </select>
                  {errors.vehicleType && (
                    <p className="text-xs text-destructive font-medium">{errors.vehicleType.message}</p>
                  )}
                </div>

                {/* Region */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Operating Region</label>
                  <input
                    type="text"
                    {...register("region")}
                    disabled={editingVehicle?.status === "Retired"}
                    placeholder="e.g. Texas Division"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  />
                </div>

                {/* Maximum Load Capacity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Max Load Capacity (Kg)*</label>
                  <input
                    type="number"
                    {...register("maximumLoadCapacity")}
                    disabled={editingVehicle?.status === "Retired"}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  />
                  {errors.maximumLoadCapacity && (
                    <p className="text-xs text-destructive font-medium">{errors.maximumLoadCapacity.message}</p>
                  )}
                </div>

                {/* Current Odometer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Current Odometer (Km)*</label>
                  <input
                    type="number"
                    {...register("currentOdometer")}
                    disabled={editingVehicle?.status === "Retired"}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  />
                  {errors.currentOdometer && (
                    <p className="text-xs text-destructive font-medium">{errors.currentOdometer.message}</p>
                  )}
                </div>

                {/* Acquisition Cost */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Acquisition Cost ($)</label>
                  <input
                    type="number"
                    {...register("acquisitionCost")}
                    disabled={editingVehicle?.status === "Retired"}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  />
                  {errors.acquisitionCost && (
                    <p className="text-xs text-destructive font-medium">{errors.acquisitionCost.message}</p>
                  )}
                </div>

                {/* Purchase Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Purchase Date</label>
                  <input
                    type="date"
                    {...register("purchaseDate")}
                    disabled={editingVehicle?.status === "Retired"}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  />
                </div>

                {/* Fuel Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Fuel Type</label>
                  <select
                    {...register("fuelType")}
                    disabled={editingVehicle?.status === "Retired"}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Gasoline">Gasoline</option>
                    <option value="Electric">Electric</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Vehicle Status*</label>
                  <select
                    {...register("status")}
                    disabled={editingVehicle?.status === "Retired"}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                {/* Insurance Expiry */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Insurance Expiry Date</label>
                  <input
                    type="date"
                    {...register("insuranceExpiry")}
                    disabled={editingVehicle?.status === "Retired"}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  />
                </div>

                {/* Fitness Expiry */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Fitness Expiry Date</label>
                  <input
                    type="date"
                    {...register("fitnessExpiry")}
                    disabled={editingVehicle?.status === "Retired"}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  />
                </div>

                {/* Pollution Expiry */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Pollution Expiry Date</label>
                  <input
                    type="date"
                    {...register("pollutionExpiry")}
                    disabled={editingVehicle?.status === "Retired"}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Remarks / Operational Notes</label>
                <textarea
                  rows={3}
                  {...register("remarks")}
                  placeholder="Enter remarks, accident history or maintenance notes..."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              {/* Modal Actions Footer */}
              <div className="p-4 border-t border-border/40 flex items-center justify-end gap-3 bg-muted/10 -mx-6 -mb-6 mt-6 rounded-b-2xl">
                <Button type="button" variant="outline" onClick={closeFormModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Save Vehicle"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL DIALOG --- */}
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
                  Are you sure you want to permanently delete vehicle <strong className="font-mono text-foreground">{deletingReg}</strong> from the fleet registry?
                </p>
                <p className="text-xs text-destructive font-medium bg-destructive/5 p-2 rounded border border-destructive/10 mt-2">
                  Warning: This action is irreversible. It will remove all matching telemetry records. Deletion is blocked if the vehicle is currently "On Trip" or "In Shop".
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={closeDeleteModal}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                Delete Vehicle
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


