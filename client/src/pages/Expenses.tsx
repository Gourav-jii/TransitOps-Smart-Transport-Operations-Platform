import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import financialService, { type ExpenseData, type FetchFinancialsParams } from "@/services/financialService"
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
  DollarSign,
  AlertTriangle,
  RotateCcw,
} from "lucide-react"

// Zod validation schema for Expense Form
const expenseSchema = z.object({
  vehicle: z.string().optional().default(""),
  trip: z.string().optional().default(""),
  expenseType: z.enum([
    "Fuel",
    "Maintenance",
    "Toll",
    "Parking",
    "Repair",
    "Insurance",
    "Tax",
    "Fine",
    "Other",
  ]),
  amount: z.coerce.number().min(0, "Expense amount cannot be negative"),
  expenseDate: z.string().min(1, "Expense date is required"),
  vendor: z.string().min(1, "Vendor name is required"),
  description: z.string().min(1, "Expense description is required"),
  receiptNumber: z.string().optional().default(""),
  remarks: z.string().optional().default(""),
})

export default function Expenses() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Roles access check: Dispatchers cannot write or modify expenses
  const isAllowedToModify = user?.role === "Fleet Manager" || user?.role === "Financial Analyst"

  // Search & Pagination States
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [vehicleFilter, setVehicleFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [startDateFilter, setStartDateFilter] = useState("")
  const [endDateFilter, setEndDateFilter] = useState("")
  const [sortBy, setSortBy] = useState("expenseDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingExpNum, setDeletingExpNum] = useState("")

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
    expenseType: typeFilter || undefined,
    startDate: startDateFilter || undefined,
    endDate: endDateFilter || undefined,
    sortBy,
    sortOrder,
  }

  // React Query: Fetch Expenses
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["expenses", fetchParams],
    queryFn: () => financialService.getExpenses(fetchParams),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: financialService.createExpense,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      toast.success("Expense Recorded", {
        description: `Expense record ${res.data.expenseId} has been saved.`,
      })
      closeFormModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to record expense."
      toast.error("Registration Error", { description: msg })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseData> }) =>
      financialService.updateExpense(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      toast.success("Expense Updated", {
        description: `Expense record ${res.data.expenseId} has been updated.`,
      })
      closeFormModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to update expense."
      toast.error("Update Error", { description: msg })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: financialService.deleteExpense,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      toast.success("Record Deleted", {
        description: res.message || "Expense deleted successfully.",
      })
      closeDeleteModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to delete expense."
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
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vehicle: "",
      trip: "",
      expenseType: "Fuel" as const,
      amount: 0,
      expenseDate: "",
      vendor: "",
      description: "",
      receiptNumber: "",
      remarks: "",
    },
  })

  const openAddModal = () => {
    setEditingExpense(null)
    reset({
      vehicle: "",
      trip: "",
      expenseType: "Other",
      amount: 0,
      expenseDate: new Date().toISOString().split("T")[0],
      vendor: "",
      description: "",
      receiptNumber: "",
      remarks: "",
    })
    setIsFormOpen(true)
  }

  const openEditModal = (exp: ExpenseData) => {
    setEditingExpense(exp)

    const formatDate = (dateStr?: string | Date) => {
      if (!dateStr) return ""
      return new Date(dateStr).toISOString().split("T")[0]
    }

    const vehId = typeof exp.vehicle === "string" ? exp.vehicle : exp.vehicle?._id || ""
    const trId = typeof exp.trip === "string" ? exp.trip : exp.trip?._id || ""

    reset({
      vehicle: vehId,
      trip: trId,
      expenseType: exp.expenseType,
      amount: exp.amount,
      expenseDate: formatDate(exp.expenseDate),
      vendor: exp.vendor,
      description: exp.description,
      receiptNumber: exp.receiptNumber || "",
      remarks: exp.remarks || "",
    })
    setIsFormOpen(true)
  }

  const closeFormModal = () => {
    setIsFormOpen(false)
    setEditingExpense(null)
  }

  const openDeleteModal = (id: string, num: string) => {
    setDeletingId(id)
    setDeletingExpNum(num)
    setIsDeleteOpen(true)
  }

  const closeDeleteModal = () => {
    setDeletingId(null)
    setDeletingExpNum("")
    setIsDeleteOpen(false)
  }

  const onFormSubmit = (values: any) => {
    const formattedValues = {
      ...values,
      vehicle: values.vehicle || undefined,
      trip: values.trip || undefined,
    }
    if (editingExpense && editingExpense._id) {
      updateMutation.mutate({ id: editingExpense._id, data: formattedValues })
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
    setTypeFilter("")
    setStartDateFilter("")
    setEndDateFilter("")
    setSortBy("expenseDate")
    setSortOrder("desc")
    setPage(1)
  }

  const responseData = data?.data
  const expenses = responseData?.expenses || []
  const pagination = responseData?.pagination || { total: 0, page: 1, limit: 10, pages: 1 }

  // Array of expense type options
  const expenseTypes = [
    "Fuel",
    "Maintenance",
    "Toll",
    "Parking",
    "Repair",
    "Insurance",
    "Tax",
    "Fine",
    "Other",
  ]

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground/90">Expense Ledger</h1>
          <p className="text-muted-foreground mt-1">Audit fleet expenditures, log vehicle maintenance invoices, and track regional trip tolls.</p>
        </div>
        {isAllowedToModify && (
          <Button onClick={openAddModal} className="flex items-center gap-2 self-start sm:self-auto shadow-md">
            <Plus className="h-4 w-4" /> Log Expenditure
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
                placeholder="Search receipt, vendor, vehicle..."
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Category</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              <option value="">All Categories</option>
              {expenseTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
          <Loading size="lg" label="Retrieving ledger statements..." />
        </Card>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive p-8 text-center rounded-xl">
          <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
          <h3 className="font-bold text-lg">Expense Ledger Unavailable</h3>
          <p className="text-sm opacity-80 mt-1">Check your connection or credentials and try reloading.</p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            Reload Ledger
          </Button>
        </Card>
      ) : expenses.length === 0 ? (
        <Card className="border-border/60 p-16 text-center rounded-xl bg-card">
          <DollarSign className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground/80">No Expenses Logged</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
            There are no expense records. Log toll bills or maintenance records to populate ledger.
          </p>
          {isAllowedToModify && (
            <Button onClick={openAddModal} className="mt-6">
              Log Expense
            </Button>
          )}
        </Card>
      ) : (
        /* EXPENSE LEDGER TABLE */
        <Card className="border-border/60 shadow-sm bg-card overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("expenseId")}>
                    <div className="flex items-center gap-1">
                      Expense ID
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold">Vehicle</th>
                  <th className="p-4 font-semibold">Trip Reference</th>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("expenseType")}>
                    <div className="flex items-center gap-1">
                      Category
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("amount")}>
                    <div className="flex items-center gap-1">
                      Amount
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold">Vendor</th>
                  <th className="p-4 font-semibold">Description</th>
                  <th className="p-4 font-semibold hover:bg-muted/75 cursor-pointer" onClick={() => handleSort("expenseDate")}>
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {expenses.map((exp) => {
                  const veh = exp.vehicle as VehicleData | undefined
                  const tr = exp.trip as { tripNumber: string } | undefined
                  return (
                    <tr key={exp._id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-foreground/80">{exp.expenseId}</td>
                      <td className="p-4 font-semibold text-foreground/80">
                        {veh ? (
                          <Link to={`/vehicles/${veh._id}`} className="hover:underline text-primary font-mono font-bold">
                            {veh.registrationNumber}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">General</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-xs">
                        {tr ? (
                          <Link to={`/trips/${exp.trip as string || (exp.trip as any)._id}`} className="text-xs text-primary font-bold hover:underline font-mono">
                            {tr.tripNumber}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          exp.expenseType === "Fuel" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" :
                          exp.expenseType === "Maintenance" || exp.expenseType === "Repair" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400" :
                          exp.expenseType === "Fine" ? "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400" :
                          "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400"
                        }`}>
                          {exp.expenseType}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs font-bold text-foreground">${exp.amount.toLocaleString()}</td>
                      <td className="p-4 text-xs font-medium">{exp.vendor}</td>
                      <td className="p-4 text-xs max-w-xs truncate" title={exp.description}>
                        {exp.description}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(exp.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isAllowedToModify ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(exp)}
                                className="h-8 w-8"
                                title="Edit expense"
                              >
                                <Edit2 className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteModal(exp._id!, exp.expenseId!)}
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                title="Delete expense"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          ) : (
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

      {/* --- ADD / EDIT EXPENSE MODAL DIALOG --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {editingExpense ? `Edit Expense Details (${editingExpense.expenseId})` : "Record operational expenditure"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete cost centers, vendors, description parameters, and receipts.
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
            <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Vehicle (optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Select Vehicle</label>
                  <select
                    {...register("vehicle")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  >
                    <option value="">None (General overhead)</option>
                    {(vehiclesData?.data?.vehicles || []).map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.registrationNumber} ({v.vehicleName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Trip (optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Trip Assignment (Optional)</label>
                  <select
                    {...register("trip")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  >
                    <option value="">None (Overhead cost)</option>
                    {(tripsData?.data?.trips || []).map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.tripNumber} ({t.source} &rarr; {t.destination})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expense Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Expense Category Type*</label>
                  <select
                    {...register("expenseType")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  >
                    {expenseTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.expenseType && (
                    <p className="text-xs text-destructive font-medium">{errors.expenseType.message}</p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Expenditure Amount ($)*</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("amount")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {errors.amount && (
                    <p className="text-xs text-destructive font-medium">{errors.amount.message}</p>
                  )}
                </div>

                {/* Vendor */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Service Vendor*</label>
                  <input
                    type="text"
                    {...register("vendor")}
                    placeholder="e.g. Loves Truck Service"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {errors.vendor && (
                    <p className="text-xs text-destructive font-medium">{errors.vendor.message}</p>
                  )}
                </div>

                {/* Receipt Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Receipt Number</label>
                  <input
                    type="text"
                    {...register("receiptNumber")}
                    placeholder="e.g. REC-9922-1"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                {/* Expense Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Expense Date*</label>
                  <input
                    type="date"
                    {...register("expenseDate")}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Expense Description*</label>
                <input
                  type="text"
                  {...register("description")}
                  placeholder="e.g. Toll charges on highway 9"
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
                {errors.description && (
                  <p className="text-xs text-destructive font-medium">{errors.description.message}</p>
                )}
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Remarks / Service Notes</label>
                <textarea
                  rows={2}
                  {...register("remarks")}
                  placeholder="Enter remarks or comments..."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              {/* Modal Actions Footer */}
              <div className="p-4 border-t border-border/40 flex items-center justify-end gap-3 bg-muted/10 -mx-6 -mb-6 mt-6 rounded-b-2xl">
                <Button type="button" variant="outline" onClick={closeFormModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Recording..." : "Save Expense Record"}
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
                <h3 className="text-lg font-bold">Delete Expense Record</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to permanently delete expense record <strong className="font-mono text-foreground">{deletingExpNum}</strong> from the ledger logs?
                </p>
                <p className="text-xs text-destructive font-medium bg-destructive/5 p-2 rounded border border-destructive/10 mt-2">
                  Warning: This action is irreversible. It will adjust matching financial ROI calculations.
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
                {deleteMutation.isPending ? "Deleting..." : "Delete Expense"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


