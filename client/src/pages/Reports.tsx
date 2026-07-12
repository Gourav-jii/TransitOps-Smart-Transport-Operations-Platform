import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import reportService from "@/services/reportService"
import vehicleService from "@/services/vehicleService"
import driverService from "@/services/driverService"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Loading } from "@/components/ui/Loading"
import {
  FileText,
  Download,
  Filter,
  TrendingUp,
  DollarSign,
  Truck,
  Users,
  Activity,
  Wrench,
  Fuel,
  AlertTriangle,
} from "lucide-react"

type ReportType =
  | "fleet"
  | "vehicles"
  | "drivers"
  | "trips"
  | "maintenance"
  | "fuel"
  | "expenses"
  | "financial"
  | "roi"

export default function Reports() {
  const { user } = useAuth()
  const isAllowedToExport = user?.role === "Fleet Manager" || user?.role === "Financial Analyst"

  // Active Report State
  const [activeReport, setActiveReport] = useState<ReportType>("fleet")

  // Filters State
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [driver, setDriver] = useState("")
  const [tripStatus, setTripStatus] = useState("")
  const [maintenanceStatus, setMaintenanceStatus] = useState("")
  const [expenseType, setExpenseType] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [region, setRegion] = useState("")

  // Fetch Dropdowns
  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles-list"],
    queryFn: () => vehicleService.getVehicles({ limit: 100 }),
  })

  const { data: driversData } = useQuery({
    queryKey: ["drivers-list"],
    queryFn: () => driverService.getDrivers({ limit: 100 }),
  })

  // Compile active filters
  const activeFilters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    vehicle: vehicle || undefined,
    driver: driver || undefined,
    tripStatus: tripStatus || undefined,
    maintenanceStatus: maintenanceStatus || undefined,
    expenseType: expenseType || undefined,
    vehicleType: vehicleType || undefined,
    region: region || undefined,
  }

  // React Query: Fetch Report Data
  const { data, isLoading, isError } = useQuery<any>({
    queryKey: ["reports", activeReport, activeFilters],
    queryFn: async () => {
      switch (activeReport) {
        case "fleet":
          return reportService.getFleetReport(activeFilters)
        case "vehicles":
          return reportService.getVehiclesReport(activeFilters)
        case "drivers":
          return reportService.getDriversReport(activeFilters)
        case "trips":
          return reportService.getTripsReport(activeFilters)
        case "maintenance":
          return reportService.getMaintenanceReport(activeFilters)
        case "fuel":
          return reportService.getFuelReport(activeFilters)
        case "expenses":
          return reportService.getExpensesReport(activeFilters)
        case "financial":
          return reportService.getFinancialReport(activeFilters)
        case "roi":
          return reportService.getRoiReport(activeFilters)
        default:
          return null
      }
    },
  })

  const handleExport = async (format: "csv" | "pdf") => {
    if (!isAllowedToExport) {
      toast.error("Export Restricted", {
        description: "Your role does not have authorization to download operations logs.",
      })
      return
    }

    try {
      toast.loading(`Formatting ${format.toUpperCase()} stream...`)
      if (format === "csv") {
        await reportService.exportCSV(activeReport, activeFilters)
      } else {
        await reportService.exportPDF(activeReport, activeFilters)
      }
      toast.dismiss()
      toast.success("Download Complete", {
        description: `${activeReport.toUpperCase()} report exported successfully.`,
      })
    } catch (err: any) {
      toast.dismiss()
      toast.error("Export Failed", {
        description: err.message || "Failed to generate report file stream.",
      })
    }
  }

  // Sidebar Tabs Config (Restricted lists for Dispatchers)
  const reportTabs = [
    { id: "fleet", label: "Fleet Summary", icon: TrendingUp, roles: ["Fleet Manager", "Financial Analyst", "Safety Officer", "Dispatcher"] },
    { id: "vehicles", label: "Vehicle Report", icon: Truck, roles: ["Fleet Manager", "Financial Analyst", "Safety Officer", "Dispatcher"] },
    { id: "drivers", label: "Driver Report", icon: Users, roles: ["Fleet Manager", "Financial Analyst", "Safety Officer", "Dispatcher"] },
    { id: "trips", label: "Trip Report", icon: Activity, roles: ["Fleet Manager", "Financial Analyst", "Safety Officer", "Dispatcher"] },
    { id: "maintenance", label: "Maintenance Report", icon: Wrench, roles: ["Fleet Manager", "Financial Analyst", "Safety Officer", "Dispatcher"] },
    { id: "fuel", label: "Fuel Report", icon: Fuel, roles: ["Fleet Manager", "Financial Analyst", "Safety Officer", "Dispatcher"] },
    { id: "expenses", label: "Expense Report", icon: DollarSign, roles: ["Fleet Manager", "Financial Analyst", "Safety Officer"] },
    { id: "financial", label: "Financial Report", icon: DollarSign, roles: ["Fleet Manager", "Financial Analyst", "Safety Officer"] },
    { id: "roi", label: "ROI Report", icon: PercentIcon, roles: ["Fleet Manager", "Financial Analyst", "Safety Officer"] },
  ] as const

  // Filter out tabs the user doesn't have access to
  const visibleTabs = reportTabs.filter((tab) => tab.roles.includes(user?.role as any))

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground/90">Reports & Analytics Exporter</h1>
          <p className="text-muted-foreground mt-1">Generate fleet operational summaries, track ROI metrics, and download CSV/PDF logs.</p>
        </div>
        {isAllowedToExport && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button variant="outline" className="flex items-center gap-1.5 shadow-sm" onClick={() => handleExport("csv")}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button className="flex items-center gap-1.5 shadow-md" onClick={() => handleExport("pdf")}>
              <FileText className="h-4 w-4" /> Export PDF
            </Button>
          </div>
        )}
      </div>

      {/* CORE SIDEBAR GRID SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
        
        {/* LEFT COLUMN: SIDEBAR LIST */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2.5 border-b border-border/40 bg-muted/10">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Report Type</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex flex-row overflow-x-auto lg:flex-col gap-1 md:gap-1.5 scrollbar-thin">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeReport === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveReport(tab.id as ReportType)}
                    className={`w-auto lg:w-full flex-shrink-0 whitespace-nowrap flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: FILTERS, STATS, TABLES */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* FILTER BAR PANEL */}
          <Card className="border-border/60 shadow-sm bg-card">
            <CardHeader className="pb-2 border-b border-border/40 bg-muted/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" /> Filter Report Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
              {/* Date Start */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground block">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Date End */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground block">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Vehicle selector (conditionally visible) */}
              {["vehicles", "trips", "maintenance", "fuel", "expenses", "roi"].includes(activeReport) && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block">Vehicle</label>
                  <select
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-2 py-2 text-xs focus:outline-none"
                  >
                    <option value="">All Vehicles</option>
                    {(vehiclesData?.data?.vehicles || []).map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.registrationNumber}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Driver selector */}
              {["drivers", "trips"].includes(activeReport) && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block">Driver</label>
                  <select
                    value={driver}
                    onChange={(e) => setDriver(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-2 py-2 text-xs focus:outline-none"
                  >
                    <option value="">All Drivers</option>
                    {(driversData?.data?.drivers || []).map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status selectors */}
              {activeReport === "trips" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block">Trip Status</label>
                  <select
                    value={tripStatus}
                    onChange={(e) => setTripStatus(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-2 py-2 text-xs focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              {activeReport === "maintenance" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block">Maint Status</label>
                  <select
                    value={maintenanceStatus}
                    onChange={(e) => setMaintenanceStatus(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-2 py-2 text-xs focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              {activeReport === "expenses" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block">Expense Category</label>
                  <select
                    value={expenseType}
                    onChange={(e) => setExpenseType(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-2 py-2 text-xs focus:outline-none"
                  >
                    <option value="">All Expenses</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Toll">Toll</option>
                    <option value="Parking">Parking</option>
                    <option value="Repair">Repair</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Tax">Tax</option>
                    <option value="Fine">Fine</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              {/* Reset filter buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate("")
                  setEndDate("")
                  setVehicle("")
                  setDriver("")
                  setTripStatus("")
                  setMaintenanceStatus("")
                  setExpenseType("")
                  setVehicleType("")
                  setRegion("")
                }}
                className="flex items-center gap-1.5 h-9 w-full"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>

          {/* REPORT RESULTS CONTAINER */}
          {isLoading ? (
            <Card className="border-border/60 p-12">
              <Loading size="md" label="Aggregating database operations logs..." />
            </Card>
          ) : isError ? (
            <Card className="border-destructive/30 bg-destructive/5 text-destructive p-8 text-center">
              <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
              <h3 className="font-bold">Operations Logs Unresolvable</h3>
              <p className="text-xs opacity-80 mt-1">Verify filters or database connection settings.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              
              {/* FLEET REPORT VIEW */}
              {activeReport === "fleet" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SummaryCard title="Fleet Strength" value={data.data.totalVehicles} icon={Truck} />
                  <SummaryCard title="Drivers Registered" value={data.data.totalDrivers} icon={Users} />
                  <SummaryCard title="Completed Trips" value={data.data.completedTrips} icon={Activity} />
                  <SummaryCard title="Distance Logged" value={`${data.data.totalDistance.toLocaleString()} km`} icon={TrendingUp} />
                  <SummaryCard title="Total Fuel OPEX" value={`$${data.data.totalFuelCost.toLocaleString()}`} icon={Fuel} />
                  <SummaryCard title="Maintenance OPEX" value={`$${data.data.totalMaintenanceCost.toLocaleString()}`} icon={Wrench} />
                  <SummaryCard title="Operational OPEX" value={`$${(data.data.totalFuelCost + data.data.totalMaintenanceCost).toLocaleString()}`} icon={DollarSign} />
                  <SummaryCard title="Revenue Settled" value={`$${data.data.totalRevenue.toLocaleString()}`} icon={DollarSign} />
                </div>
              )}

              {/* FINANCIAL REPORT VIEW */}
              {activeReport === "financial" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <SummaryCard title="Completed Revenue" value={`$${data.data.revenue.toLocaleString()}`} icon={DollarSign} />
                  <SummaryCard title="Total Expenditures (OPEX)" value={`$${(data.data.fuelCost + data.data.maintenanceCost + data.data.otherExpenses).toLocaleString()}`} icon={DollarSign} />
                  <SummaryCard title="Net Settlement Profit" value={`$${data.data.netProfit.toLocaleString()}`} icon={DollarSign} />
                </div>
              )}

              {/* VEHICLE REPORT TABLE */}
              {activeReport === "vehicles" && (
                <ReportTable
                  headers={["Plate No", "Name", "Type", "Trips", "Distance", "Fuel ($)", "Maint ($)", "OPEX ($)", "ROI (%)"]}
                  rows={data.data.map((item: any) => [
                    item.vehicleId,
                    item.name,
                    item.type,
                    item.tripsCompleted,
                    `${item.distanceCovered.toLocaleString()} km`,
                    `$${item.fuelCost.toLocaleString()}`,
                    `$${item.maintenanceCost.toLocaleString()}`,
                    `$${item.totalExpense.toLocaleString()}`,
                    `${item.roi}%`,
                  ])}
                />
              )}

              {/* DRIVER REPORT TABLE */}
              {activeReport === "drivers" && (
                <ReportTable
                  headers={["License No", "Full Name", "Status", "Expiry Date", "Completed Trips", "Safety Score"]}
                  rows={data.data.map((item: any) => [
                    item.driverId,
                    item.name,
                    item.status,
                    new Date(item.licenseExpiry).toLocaleDateString(),
                    item.tripsCompleted,
                    `${item.safetyScore}/100`,
                  ])}
                />
              )}

              {/* TRIP REPORT TABLE */}
              {activeReport === "trips" && (
                <ReportTable
                  headers={["Trip No", "Route", "Vehicle", "Driver", "Distance", "Fuel (L)", "Revenue", "Status"]}
                  rows={data.data.map((item: any) => [
                    item.tripNumber,
                    `${item.source} to ${item.destination}`,
                    item.vehiclePlate,
                    item.driverName,
                    `${item.distance.toLocaleString()} km`,
                    `${item.fuelUsed} L`,
                    `$${item.revenue.toLocaleString()}`,
                    item.status,
                  ])}
                />
              )}

              {/* MAINTENANCE REPORT TABLE */}
              {activeReport === "maintenance" && (
                <ReportTable
                  headers={["Job ID", "Vehicle Plate", "Type", "Cost ($)", "Vendor", "Status", "Scheduled Date"]}
                  rows={data.data.map((item: any) => [
                    item.maintenanceId,
                    item.vehiclePlate,
                    item.serviceType,
                    `$${item.cost.toLocaleString()}`,
                    item.vendor,
                    item.status,
                    new Date(item.scheduledDate).toLocaleDateString(),
                  ])}
                />
              )}

              {/* FUEL REPORT TABLE */}
              {activeReport === "fuel" && (
                <ReportTable
                  headers={["Log ID", "Vehicle Plate", "Trip", "Liters", "Cost", "Price/Liter", "Fuel Station", "Date"]}
                  rows={data.data.map((item: any) => [
                    item.fuelLogId,
                    item.vehiclePlate,
                    item.tripNumber,
                    `${item.liters} L`,
                    `$${item.cost.toLocaleString()}`,
                    `$${item.pricePerLiter.toFixed(2)}/L`,
                    item.fuelStation,
                    new Date(item.fuelDate).toLocaleDateString(),
                  ])}
                />
              )}

              {/* EXPENSE REPORT TABLE */}
              {activeReport === "expenses" && (
                <ReportTable
                  headers={["Expense ID", "Vehicle Plate", "Category", "Amount ($)", "Vendor", "Expense Date", "Description"]}
                  rows={data.data.map((item: any) => [
                    item.expenseId,
                    item.vehiclePlate,
                    item.expenseType,
                    `$${item.amount.toLocaleString()}`,
                    item.vendor,
                    new Date(item.expenseDate).toLocaleDateString(),
                    item.description,
                  ])}
                />
              )}

              {/* ROI REPORT TABLE */}
              {activeReport === "roi" && (
                <ReportTable
                  headers={["Vehicle Plate", "Acquisition Cost", "Total Revenue", "OPEX Expenditures", "Net profit", "ROI (%)"]}
                  rows={data.data.map((item: any) => [
                    item.vehiclePlate,
                    `$${item.acquisitionCost.toLocaleString()}`,
                    `$${item.revenue.toLocaleString()}`,
                    `$${item.opex.toLocaleString()}`,
                    `$${item.profit.toLocaleString()}`,
                    `${item.roiPercent}%`,
                  ])}
                />
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  )
}

// Simple Helper Components

function SummaryCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) {
  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-semibold">{title}</p>
          <h4 className="text-xl font-bold text-foreground mt-1.5 font-mono">{value}</h4>
        </div>
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function ReportTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <Card className="border-border/60 overflow-hidden shadow-sm bg-card">
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/50 border-b border-border/40 text-muted-foreground font-semibold uppercase">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-muted/10 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className={`p-3 ${j === 0 ? "font-semibold font-mono text-foreground" : "text-muted-foreground"}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// Reusable Percent icon helper since Lucide Percent can sometimes hit dynamic resolution errors in Vite
function PercentIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="19" x2="5" y1="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  )
}

