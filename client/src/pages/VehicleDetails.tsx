import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import vehicleService from "@/services/vehicleService"
import financialService from "@/services/financialService"
import tripService from "@/services/tripService"
import api from "@/services/api"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Loading } from "@/components/ui/Loading"
import {
  ArrowLeft,
  Truck,
  Calendar,
  Wrench,
  Fuel,
  DollarSign,
  Info,
  Clock,
  Shield,
  Activity,
  MapPin,
  Scale,
  Gauge,
  Droplet,
  Percent,
  TrendingUp,
} from "lucide-react"

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"profile" | "financial" | "fuel" | "expenses" | "trips" | "maintenance">("profile")

  // React Query: Fetch single vehicle details
  const { data: vehicleData, isLoading: isVehicleLoading, isError: isVehicleError } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => vehicleService.getVehicleById(id!),
    enabled: !!id,
  })

  // React Query: Fetch Vehicle Financial Summary
  const { data: financialSummaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["vehicle-financial-summary", id],
    queryFn: () => financialService.getVehicleFinancialSummary(id!),
    enabled: !!id && activeTab === "financial",
  })

  // React Query: Fetch matching Fuel Logs
  const { data: vehicleFuelData } = useQuery({
    queryKey: ["vehicle-fuel-logs", id],
    queryFn: () => financialService.getFuelLogs({ vehicle: id, limit: 10 }),
    enabled: !!id && activeTab === "fuel",
  })

  // React Query: Fetch matching Expenses
  const { data: vehicleExpenseData } = useQuery({
    queryKey: ["vehicle-expenses", id],
    queryFn: () => financialService.getExpenses({ vehicle: id, limit: 10 }),
    enabled: !!id && activeTab === "expenses",
  })

  // React Query: Fetch matching Trips
  const { data: vehicleTripsData } = useQuery({
    queryKey: ["vehicle-trips", id],
    queryFn: () => tripService.getTrips({ vehicle: id, limit: 10 }),
    enabled: !!id && activeTab === "trips",
  })

  // React Query: Fetch matching Maintenance Logs (from backend /maintenance)
  const { data: vehicleMaintenanceData } = useQuery({
    queryKey: ["vehicle-maintenance", id],
    queryFn: async () => {
      const res = await api.get(`/maintenance?vehicle=${id}&limit=10`)
      return res.data
    },
    enabled: !!id && activeTab === "maintenance",
  })

  if (isVehicleLoading) {
    return (
      <Card className="border-border/60 p-12">
        <Loading size="lg" label="Retrieving vehicle specifications..." />
      </Card>
    )
  }

  if (isVehicleError || !vehicleData?.success) {
    return (
      <div className="space-y-4 max-w-lg mx-auto text-center py-12">
        <div className="p-4 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 w-fit mx-auto">
          <Info className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold">Vehicle Not Found</h2>
        <p className="text-muted-foreground text-sm">
          The requested vehicle profile ID is invalid or has been deleted from the fleet registry.
        </p>
        <Button onClick={() => navigate("/vehicles")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Vehicles
        </Button>
      </div>
    )
  }

  const vehicle = vehicleData.data

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCost = (val?: number) => {
    if (val === undefined || val === null) return "N/A"
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Configuration for tabs
  const tabs = [
    { id: "profile", label: "Profile Specs", icon: Info },
    { id: "financial", label: "Financial Overview", icon: DollarSign },
    { id: "fuel", label: "Fuel Logs", icon: Fuel },
    { id: "expenses", label: "Expenses", icon: DollarSign },
    { id: "trips", label: "Trip History", icon: Activity },
    { id: "maintenance", label: "Maintenance Logs", icon: Wrench },
  ] as const;

  const financialSummary = financialSummaryData?.data?.metrics

  return (
    <div className="space-y-6">
      
      {/* HEADER NAVIGATION BAR */}
      <div className="flex items-center gap-4 text-left">
        <Button variant="outline" size="icon" onClick={() => navigate("/vehicles")} className="h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight font-mono">{vehicle.registrationNumber}</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              vehicle.status === "Available" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" :
              vehicle.status === "On Trip" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" :
              vehicle.status === "In Shop" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400" :
              "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400"
            }`}>
              {vehicle.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {vehicle.manufacturer} {vehicle.model} &bull; Registered in Region: {vehicle.region || "Global"}
          </p>
        </div>
      </div>

      {/* CORE PROFILE GRID SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
        
        {/* LEFT COLUMN: VEHICLE BADGE DETAILS */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/60 shadow-sm bg-card text-center">
            <CardContent className="pt-6 space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto shadow-inner">
                <Truck className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{vehicle.vehicleName}</h3>
                <p className="text-xs text-muted-foreground font-mono">{vehicle.vehicleType}</p>
              </div>

              {/* Core metrics panel */}
              <div className="border-t border-b border-border/40 py-4 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="border-r border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Odometer</p>
                  <p className="font-mono font-bold text-foreground mt-0.5">{vehicle.currentOdometer.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Fuel Type</p>
                  <p className="font-semibold text-foreground mt-0.5">{vehicle.fuelType || "Diesel"}</p>
                </div>
              </div>

              {/* Timestamp panel */}
              <div className="space-y-2 text-left text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Registered: {formatDate(vehicle.purchaseDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Insurance: {formatDate(vehicle.insuranceExpiry)}</span>
                </div>
                {vehicle.createdBy && (
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Officer: {vehicle.createdBy.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: DETAILED SPECIFICATIONS OR TAB CONTEXT */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB SELECTION HEADER */}
          <div className="border-b border-border/60 flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* TAB PANELS CONTAINER */}
          <div className="pt-2">
            
            {/* PROFILE SPECS TAB */}
            {activeTab === "profile" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel 1: Primary Details */}
                <Card className="border-border/60">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" /> General Registry
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3.5 text-sm text-left">
                    <div className="grid grid-cols-2 border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Manufacturer</span>
                      <span className="font-semibold">{vehicle.manufacturer}</span>
                    </div>
                    <div className="grid grid-cols-2 border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Model Series</span>
                      <span className="font-semibold">{vehicle.model}</span>
                    </div>
                    <div className="grid grid-cols-2 border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Vehicle Type</span>
                      <span className="font-semibold">{vehicle.vehicleType}</span>
                    </div>
                    <div className="grid grid-cols-2 border-b border-border/30 pb-2">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Region
                      </span>
                      <span className="font-semibold">{vehicle.region || "Unassigned"}</span>
                    </div>
                    <div className="grid grid-cols-2 border-b border-border/30 pb-2">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5" /> Capacity (Kg)
                      </span>
                      <span className="font-semibold font-mono">
                        {vehicle.maximumLoadCapacity ? `${vehicle.maximumLoadCapacity.toLocaleString()} kg` : "N/A"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 pb-1">
                      <span className="text-muted-foreground">Acquisition Cost</span>
                      <span className="font-semibold font-mono">{formatCost(vehicle.acquisitionCost)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Panel 2: Dates and Expiries */}
                <Card className="border-border/60">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" /> Expirations & Dates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3.5 text-sm text-left">
                    <div className="grid grid-cols-2 border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Purchase Date</span>
                      <span className="font-semibold font-mono">{formatDate(vehicle.purchaseDate)}</span>
                    </div>
                    <div className="grid grid-cols-2 border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Insurance Expiry</span>
                      <span className="font-semibold font-mono">{formatDate(vehicle.insuranceExpiry)}</span>
                    </div>
                    <div className="grid grid-cols-2 border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Fitness Expiry</span>
                      <span className="font-semibold font-mono">{formatDate(vehicle.fitnessExpiry)}</span>
                    </div>
                    <div className="grid grid-cols-2 border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Pollution Cert Expiry</span>
                      <span className="font-semibold font-mono">{formatDate(vehicle.pollutionExpiry)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Remarks/Notes */}
                <Card className="col-span-1 md:col-span-2 border-border/60">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Operational Remarks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-left">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {vehicle.remarks || "No remarks or special service logs provided for this fleet asset."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* FINANCIAL OVERVIEW TAB */}
            {activeTab === "financial" && (
              <div className="space-y-6">
                {isSummaryLoading ? (
                  <Loading size="md" label="Computing operational costs..." />
                ) : !financialSummary ? (
                  <p className="text-sm text-muted-foreground italic text-center py-6">Failed to calculate financial overview analytics.</p>
                ) : (
                  <>
                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      
                      {/* Total Fuel Cost */}
                      <Card className="border-border/60 shadow-sm">
                        <CardContent className="p-4 text-left">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                            <Fuel className="h-3.5 w-3.5 text-blue-500" /> Fuel Expenditures
                          </p>
                          <h3 className="text-xl font-bold font-mono mt-1">{formatCost(financialSummary.totalFuelCost)}</h3>
                        </CardContent>
                      </Card>

                      {/* Total Maintenance Cost */}
                      <Card className="border-border/60 shadow-sm">
                        <CardContent className="p-4 text-left">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                            <Wrench className="h-3.5 w-3.5 text-amber-500" /> Maintenance Cost
                          </p>
                          <h3 className="text-xl font-bold font-mono mt-1">{formatCost(financialSummary.totalMaintenanceCost)}</h3>
                        </CardContent>
                      </Card>

                      {/* General Expenses */}
                      <Card className="border-border/60 shadow-sm">
                        <CardContent className="p-4 text-left">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Other Expenses
                          </p>
                          <h3 className="text-xl font-bold font-mono mt-1">{formatCost(financialSummary.otherExpensesCost)}</h3>
                        </CardContent>
                      </Card>

                      {/* Total Operational Cost */}
                      <Card className="border-border/60 shadow-sm bg-muted/20">
                        <CardContent className="p-4 text-left">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Operational Cost (OPEX)</p>
                          <h3 className="text-xl font-bold font-mono mt-1">{formatCost(financialSummary.operationalCost)}</h3>
                        </CardContent>
                      </Card>

                      {/* Total Revenues */}
                      <Card className="border-border/60 shadow-sm">
                        <CardContent className="p-4 text-left">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Completed Revenue</p>
                          <h3 className="text-xl font-bold font-mono mt-1">{formatCost(financialSummary.totalRevenue)}</h3>
                        </CardContent>
                      </Card>

                      {/* ROI */}
                      <Card className={`border-border/60 shadow-sm ${
                        financialSummary.roi >= 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
                      }`}>
                        <CardContent className="p-4 text-left">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                            <Percent className="h-3.5 w-3.5" /> Return on Investment (ROI)
                          </p>
                          <h3 className={`text-xl font-bold font-mono mt-1 flex items-center gap-1 ${
                            financialSummary.roi >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"
                          }`}>
                            <TrendingUp className="h-4 w-4" /> {financialSummary.roi}%
                          </h3>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Efficiency & Distance Details */}
                    <Card className="border-border/60 shadow-sm bg-card">
                      <CardHeader className="pb-3 border-b border-border/40">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Operational Efficiency Telemetry
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">Average Fuel Efficiency</p>
                          <p className="font-bold text-foreground mt-1 flex items-center gap-1 font-mono">
                            <Droplet className="h-4 w-4 text-blue-500" /> {financialSummary.fuelEfficiency} Km/L
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">Cost per Kilometer</p>
                          <p className="font-bold text-foreground mt-1 flex items-center gap-1 font-mono">
                            <DollarSign className="h-4 w-4 text-emerald-500" /> ${financialSummary.costPerKm}/Km
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">Total Distance Logged</p>
                          <p className="font-bold text-foreground mt-1 flex items-center gap-1 font-mono">
                            <Gauge className="h-4 w-4 text-muted-foreground" /> {financialSummary.totalDistance.toLocaleString()} Km
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">Total Fuel Consumed</p>
                          <p className="font-bold text-foreground mt-1 flex items-center gap-1 font-mono">
                            <Fuel className="h-4 w-4 text-muted-foreground" /> {financialSummary.totalFuelConsumed.toLocaleString()} L
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* FUEL LOGS SUB-LIST */}
            {activeTab === "fuel" && (
              <Card className="border-border/60 overflow-hidden bg-card">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Refueling Log Registry
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {!vehicleFuelData?.data?.fuelLogs || vehicleFuelData.data.fuelLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">No refuel events logged for this vehicle.</p>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/30 border-b border-border/40 text-muted-foreground font-semibold uppercase">
                        <tr>
                          <th className="p-3">Log ID</th>
                          <th className="p-3">Liters</th>
                          <th className="p-3">Cost</th>
                          <th className="p-3">Price/L</th>
                          <th className="p-3">Odometer</th>
                          <th className="p-3">Station</th>
                          <th className="p-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {vehicleFuelData.data.fuelLogs.map((log) => (
                          <tr key={log._id} className="hover:bg-muted/10">
                            <td className="p-3 font-mono font-bold text-foreground/80">{log.fuelLogId}</td>
                            <td className="p-3 font-mono">{log.liters} L</td>
                            <td className="p-3 font-mono font-semibold text-foreground">${log.cost.toLocaleString()}</td>
                            <td className="p-3 font-mono text-muted-foreground">${log.pricePerLiter?.toFixed(2)}/L</td>
                            <td className="p-3 font-mono">{log.odometer.toLocaleString()} km</td>
                            <td className="p-3">{log.fuelStation}</td>
                            <td className="p-3 text-muted-foreground">{new Date(log.fuelDate).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* EXPENSES SUB-LIST */}
            {activeTab === "expenses" && (
              <Card className="border-border/60 overflow-hidden bg-card">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Operational Expenditures Ledger
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {!vehicleExpenseData?.data?.expenses || vehicleExpenseData.data.expenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">No expenses logged for this vehicle.</p>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/30 border-b border-border/40 text-muted-foreground font-semibold uppercase">
                        <tr>
                          <th className="p-3">Expense ID</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Vendor</th>
                          <th className="p-3">Description</th>
                          <th className="p-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {vehicleExpenseData.data.expenses.map((exp) => (
                          <tr key={exp._id} className="hover:bg-muted/10">
                            <td className="p-3 font-mono font-bold text-foreground/80">{exp.expenseId}</td>
                            <td className="p-3 font-semibold text-foreground/80">{exp.expenseType}</td>
                            <td className="p-3 font-mono font-semibold text-foreground">${exp.amount.toLocaleString()}</td>
                            <td className="p-3">{exp.vendor}</td>
                            <td className="p-3 max-w-xs truncate" title={exp.description}>{exp.description}</td>
                            <td className="p-3 text-muted-foreground">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* TRIP HISTORY SUB-LIST */}
            {activeTab === "trips" && (
              <Card className="border-border/60 overflow-hidden bg-card">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Route Dispatch Logs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {!vehicleTripsData?.data?.trips || vehicleTripsData.data.trips.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">No trip dispatch logs found for this vehicle.</p>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/30 border-b border-border/40 text-muted-foreground font-semibold uppercase">
                        <tr>
                          <th className="p-3">Trip No</th>
                          <th className="p-3">Route</th>
                          <th className="p-3">Cargo Weight</th>
                          <th className="p-3">Distance</th>
                          <th className="p-3">Revenue</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {vehicleTripsData.data.trips.map((tr) => (
                          <tr key={tr._id} className="hover:bg-muted/10">
                            <td className="p-3 font-mono font-bold">
                              <Link to={`/trips/${tr._id}`} className="text-primary hover:underline">
                                {tr.tripNumber}
                              </Link>
                            </td>
                            <td className="p-3">{tr.source} &rarr; {tr.destination}</td>
                            <td className="p-3 font-mono">{tr.cargoWeight.toLocaleString()} kg</td>
                            <td className="p-3 font-mono">
                              {tr.status === "Completed" ? `${tr.actualDistance} km` : `${tr.plannedDistance} km (est)`}
                            </td>
                            <td className="p-3 font-mono font-semibold text-foreground">
                              {tr.status === "Completed" ? formatCost(tr.revenue || tr.estimatedRevenue) : formatCost(tr.estimatedRevenue)}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                tr.status === "Completed" ? "bg-emerald-100 text-emerald-800" :
                                tr.status === "Dispatched" ? "bg-blue-100 text-blue-800" :
                                "bg-slate-100 text-slate-800"
                              }`}>
                                {tr.status}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground">{new Date(tr.plannedStartDate).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* MAINTENANCE SUB-LIST */}
            {activeTab === "maintenance" && (
              <Card className="border-border/60 overflow-hidden bg-card">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Completed Maintenance Logs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {!vehicleMaintenanceData?.data?.logs || vehicleMaintenanceData.data.logs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">No maintenance records found for this vehicle.</p>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/30 border-b border-border/40 text-muted-foreground font-semibold uppercase">
                        <tr>
                          <th className="p-3">Job ID</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Service Cost</th>
                          <th className="p-3">Description</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Completed Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {vehicleMaintenanceData.data.logs.map((log: any) => (
                          <tr key={log._id} className="hover:bg-muted/10">
                            <td className="p-3 font-mono font-bold text-foreground/80">{log.maintenanceId}</td>
                            <td className="p-3 font-semibold text-foreground/80">{log.serviceType}</td>
                            <td className="p-3 font-mono font-bold text-foreground">${log.cost?.toLocaleString()}</td>
                            <td className="p-3 max-w-xs truncate" title={log.description}>{log.description}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold">
                                {log.status}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground">{new Date(log.completedDate || log.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
