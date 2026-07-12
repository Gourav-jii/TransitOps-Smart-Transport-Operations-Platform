import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import financialService, { type FuelLogData, type FetchFinancialsParams } from "@/services/financialService"
import vehicleService, { type VehicleData } from "@/services/vehicleService"
import tripService from "@/services/tripService"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Loading } from "@/components/ui/Loading"
import {
  Plus,
  Search,
  ArrowUpDown,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Droplet,
  AlertTriangle,
  RotateCcw,
} from "lucide-react"

// Zod validation schema for Fuel Log Form
const fuelLogSchema = z.object({
  vehicle: z.string().min(1, "Vehicle is required"),
  trip: z.string().optional().default(""),
  fuelDate: z.string().min(1, "Fuel date is required"),
  fuelStation: z.string().min(1, "Fuel station/location is required"),
  liters: z.coerce.number().gt(0, "Liters quantity must be greater than zero"),
  cost: z.coerce.number().min(0, "Fuel cost cannot be negative"),
  odometer: z.coerce.number().min(0, "Odometer reading cannot be negative"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  receiptNumber: z.string().optional().default(""),
  remarks: z.string().optional().default(""),
})

export default function FuelLogs() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Roles access check
  const isOfficer = user?.role === "Safety Officer"
  const isAllowedToWrite = user?.role === "Fleet Manager" || user?.role === "Financial Analyst" || user?.role === "Dispatcher"
  const isAllowedToEditDelete = user?.role === "Fleet Manager" || user?.role === "Financial Analyst"

  // Search & Pagination States
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [vehicleFilter, setVehicleFilter] = useState("")
  const [startDateFilter, setStartDateFilter] = useState("")
  const [endDateFilter, setEndDateFilter] = useState("")
  const [sortBy, setSortBy] = useState("fuelDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<FuelLogData | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingLogNum, setDeletingLogNum] = useState("")

  // Fetch dropdown collections
  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles-dropdown"],
    queryFn: () => vehicleService.getVehicles({ limit: 100 }),
    enabled: isFormOpen,
  })

  const { data: tripsData } = useQuery({
    queryKey: ["trips-dropdown"],
    queryFn: () => tripService.getTrips({ limit: 100 }),
    enabled: isFormOpen,
  })

  // Construct fetch params
  const fetchParams: FetchFinancialsParams = {
    page,
    limit,
    search: search || undefined,
    vehicle: vehicleFilter || undefined,
    startDate: startDateFilter || undefined,
    endDate: endDateFilter || undefined,
    sortBy,
    sortOrder,
  }

  // React Query: Fetch Fuel Logs
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["fuel-logs", fetchParams],
    queryFn: () => financialService.getFuelLogs(fetchParams),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: financialService.createFuelLog,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] })
      toast.success("Fuel Log Recorded", {
        description: `Fuel log ${res.data.fuelLogId} has been saved.`,
      })
      closeFormModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to save fuel log."
      toast.error("Registration Error", { description: msg })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FuelLogData> }) =>
      financialService.updateFuelLog(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] })
      toast.success("Fuel Log Updated", {
        description: `Fuel log ${res.data.fuelLogId} has been updated.`,
      })
      closeFormModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to update fuel log."
      toast.error("Update Error", { description: msg })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: financialService.deleteFuelLog,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] })
      toast.success("Log Deleted", {
        description: res.message || "Fuel log deleted from registry.",
      })
      closeDeleteModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to delete log."
      toast.error("Deletion Error", { description: msg })
    },
  })

  // Form Hooks
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      vehicle: "",
      trip: "",
      fuelDate: "",
      fuelStation: "",
      liters: 0,
      cost: 0,
      odometer: 0,
      paymentMethod: "Fuel Card",
      receiptNumber: "",
      remarks: "",
    },
  })

  const openAddModal = () => {
    setEditingLog(null)
    reset({
      vehicle: "",
      trip: "",
      fuelDate: new Date().toISOString().split("T")[0],
      fuelStation: "",
      liters: 0,
      cost: 0,
      odometer: 0,
      paymentMethod: "Fuel Card",
      receiptNumber: "",
      remarks: "",
    })
    setIsFormOpen(true)
  }

  const openEditModal = (log: FuelLogData) => {
    setEditingLog(log)

    const formatDate = (dateStr?: string | Date) => {
      if (!dateStr) return ""
      return new Date(dateStr).toISOString().split("T")[0]
    }

    const vehId = typeof log.vehicle === "string" ? log.vehicle : log.vehicle?._id || ""
    const trId = typeof log.trip === "string" ? log.trip : log.trip?._id || ""

    reset({
      vehicle: vehId,
      trip: trId,
      fuelDate: formatDate(log.fuelDate),
      fuelStation: log.fuelStation,
      liters: log.liters,
      cost: log.cost,
      odometer: log.odometer,
      paymentMethod: log.paymentMethod,
      receiptNumber: log.receiptNumber || "",
      remarks: log.remarks || "",
    })
    setIsFormOpen(true)
  }

  const closeFormModal = () => {
    setIsFormOpen(false)
    setEditingLog(null)
  }

  const openDeleteModal = (id: string, num: string) => {
    setDeletingId(id)
    setDeletingLogNum(num)
    setIsDeleteOpen(true)
  }

  const closeDeleteModal = () => {
    setDeletingId(null)
    setDeletingLogNum("")
    setIsDeleteOpen(false)
  }

  const onFormSubmit = (values: any) => {
    const formattedValues = {
      ...values,
      trip: values.trip || undefined,
    }
    if (editingLog && editingLog._id) {
      updateMutation.mutate({ id: editingLog._id, data: formattedValues })
    } else {
      createMutation.mutate(formattedValues)
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
    setVehicleFilter("")
    setStartDateFilter("")
    setEndDateFilter("")
    setSortBy("fuelDate")
    setSortOrder("desc")
    setPage(1)
  }

  const responseData = data?.data
  const fuelLogs = responseData?.fuelLogs || []
  const pagination = responseData?.pagination || { total: 0, page: 1, limit: 10, pages: 1 }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Fuel Management</h1>
          <p className="text-muted-foreground mt-1">Track refueling events, monitor costs per liter, and calculate fleet efficiency logs.</p>
        </div>
        {isAllowedToWrite && !isOfficer && (
          <Button onClick={openAddModal} className="flex items-center gap-2 self-start sm:self-auto shadow-md">
            <Plus className="h-4.5 w-4.5" /> Log Fuel Refuel
          </Button>
        )}
      </div>

      {/* SEARCH AND FILTERS */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
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
                placeholder="Search receipt, station, vehicle plate..."
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Date range filter */}
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

          {/* Date range filter */}
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

      {/* DATA SECTION */}
      {isLoading ? (
        <Card className="border-border/60 p-12">
          <Loading size="lg" label="Retrieving refuel entries..." />
        </Card>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive p-8 text-center rounded-xl">
          <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
          <h3 className="font-bold text-lg">Fuel Registry Unavailable</h3>
          <p className="text-sm opacity-80 mt-1">Check your connection or credentials and try reloading.</p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            Reload Logs
          </Button>
        </Card>
      ) : fuelLogs.length === 0 ? (
        <Card className="border-border/60 p-16 text-center rounded-xl bg-card">
          <Droplet className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground/80">No Refuel Records Found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
            There are no fuel logs recorded. Fill out refuel tickets to build stats.
          </p>
          {isAllowedToWrite && !isOfficer && (
            <Button onClick={openAddModal} className="mt-6">
              Log Refuel
            </Button>
          )}
        </Card>
      ) : (
        /* FUEL LOG TABLE */
        <Card className="border-border/60 shadow-sm bg-card overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("fuelLogId")}>
                    <div className="flex items-center gap-1">
                      Log ID
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold">Vehicle</th>
                  <th className="p-4 font-semibold">Trip Reference</th>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("liters")}>
                    <div className="flex items-center gap-1">
                      Liters
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("cost")}>
                    <div className="flex items-center gap-1">
                      Total Cost
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("pricePerLiter")}>
                    <div className="flex items-center gap-1">
                      Price/Liter
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("fuelDate")}>
                    <div className="flex items-center gap-1">
                      Refuel Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold">Station / Hub</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {fuelLogs.map((log) => {
                  const veh = log.vehicle as VehicleData | undefined
                  const tr = log.trip as { tripNumber: string; source: string; destination: string } | undefined
                  return (
                    <tr key={log._id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-foreground/80">{log.fuelLogId}</td>
                      <td className="p-4 font-semibold text-foreground/80">
                        {veh ? (
                          <Link to={`/vehicles/${veh._id}`} className="hover:underline text-primary font-mono font-bold">
                            {veh.registrationNumber}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-4">
                        {tr ? (
                          <Link to={`/trips/${log.trip as string || (log.trip as any)._id}`} className="text-xs text-primary font-bold hover:underline font-mono">
                            {tr.tripNumber} ({tr.source} to {tr.destination})
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">None (Local dispatch)</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-xs">{log.liters.toLocaleString()} L</td>
                      <td className="p-4 font-mono text-xs font-semibold text-foreground">${log.cost.toLocaleString()}</td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">${log.pricePerLiter?.toFixed(2)}/L</td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(log.fuelDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-xs font-medium">{log.fuelStation}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isAllowedToEditDelete && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(log)}
                                className="h-8 w-8"
                                title="Edit log"
                              >
                                <Edit2 className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteModal(log._id!, log.fuelLogId!)}
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                title="Delete log"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {!isAllowedToEditDelete && (
                            <span className="text-[10px] text-muted-foreground italic px-2">Read-only</span>
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

      {/* --- ADD / EDIT FUEL LOG MODAL DIALOG --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {editingLog ? `Edit Fuel Log Specs (${editingLog.fuelLogId})` : "Record Fuel Refuel Ticket"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete liters, cost, odometer specs and attach receipt records.
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
            <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Vehicle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Select Vehicle*</label>
                  <select
                    {...register("vehicle")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  >
                    <option value="">Select Vehicle</option>
                    {(vehiclesData?.data?.vehicles || []).map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.registrationNumber} ({v.vehicleName})
                      </option>
                    ))}
                  </select>
                  {errors.vehicle && (
                    <p className="text-xs text-destructive font-medium">{errors.vehicle.message}</p>
                  )}
                </div>

                {/* Trip (optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Trip Assignment (Optional)</label>
                  <select
                    {...register("trip")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  >
                    <option value="">None (Local yard refill)</option>
                    {(tripsData?.data?.trips || []).map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.tripNumber} ({t.source} &rarr; {t.destination})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Liters */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Liters Quantity (L)*</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("liters")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {errors.liters && (
                    <p className="text-xs text-destructive font-medium">{errors.liters.message}</p>
                  )}
                </div>

                {/* Cost */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Total Cost ($)*</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("cost")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {errors.cost && (
                    <p className="text-xs text-destructive font-medium">{errors.cost.message}</p>
                  )}
                </div>

                {/* Odometer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Odometer Reading (Km)*</label>
                  <input
                    type="number"
                    {...register("odometer")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {errors.odometer && (
                    <p className="text-xs text-destructive font-medium">{errors.odometer.message}</p>
                  )}
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Payment Method*</label>
                  <select
                    {...register("paymentMethod")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  >
                    <option value="Fuel Card">Fuel Card</option>
                    <option value="Corporate Credit Card">Corporate Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Vendor Invoice">Vendor Invoice</option>
                  </select>
                </div>

                {/* Fuel Station */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Fuel Station / Location*</label>
                  <input
                    type="text"
                    {...register("fuelStation")}
                    placeholder="e.g. Loves Travel Stop #9"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {errors.fuelStation && (
                    <p className="text-xs text-destructive font-medium">{errors.fuelStation.message}</p>
                  )}
                </div>

                {/* Receipt Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Receipt Number</label>
                  <input
                    type="text"
                    {...register("receiptNumber")}
                    placeholder="e.g. REC-8833-2"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                {/* Fuel Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Refuel Date*</label>
                  <input
                    type="date"
                    {...register("fuelDate")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Remarks / Service Notes</label>
                <textarea
                  rows={2}
                  {...register("remarks")}
                  placeholder="Enter specific refueling notes or driver comments..."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              {/* Modal Actions Footer */}
              <div className="p-4 border-t border-border/40 flex items-center justify-end gap-3 bg-muted/10 -mx-6 -mb-6 mt-6 rounded-b-2xl">
                <Button type="button" variant="outline" onClick={closeFormModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Recording..." : "Save Refuel Log"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md p-6 text-left">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Delete Fuel Log</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to permanently delete refuel log <strong className="font-mono text-foreground">{deletingLogNum}</strong> from the dispatcher logs?
                </p>
                <p className="text-xs text-destructive font-medium bg-destructive/5 p-2 rounded border border-destructive/10 mt-2">
                  Warning: This action is irreversible. It will adjust matching fuel efficiency calculations.
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
                {deleteMutation.isPending ? "Deleting..." : "Delete Log"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
