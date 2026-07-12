import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import dashboardService from "@/services/dashboardService"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import {
  LineChart,
  BarChart,
  PieChart,
  HorizontalBar,
  ProgressRing
} from "@/components/ui/Charts"
import {
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  TrendingDown
} from "lucide-react"

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Filter configurations
  const [region, setRegion] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const filters = {
    region: region || undefined,
    vehicleType: vehicleType || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }

  // React Query: Summaries
  const { data: summaryData, isLoading: isSummaryLoading, isError: isSummaryError } = useQuery({
    queryKey: ["dashboardSummary", filters],
    queryFn: () => dashboardService.getSummary(filters).then(res => res.data.data),
  })

  // React Query: Chart datasets
  const { data: chartData, isLoading: isChartsLoading, isError: isChartsError } = useQuery({
    queryKey: ["dashboardCharts", filters],
    queryFn: () => dashboardService.getCharts(filters).then(res => res.data.data),
  })

  // React Query: Recent Activity log feeds
  const { data: activityData } = useQuery({
    queryKey: ["dashboardActivities"],
    queryFn: () => dashboardService.getRecentActivities().then(res => res.data.data),
  })

  // React Query: Alerts scanner
  const { data: alertData } = useQuery({
    queryKey: ["dashboardAlerts"],
    queryFn: () => dashboardService.getAlerts().then(res => res.data.data),
  })

  const isLoading = isSummaryLoading || isChartsLoading
  const isError = isSummaryError || isChartsError

  // Date formatted values
  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleResetFilters = () => {
    setRegion("")
    setVehicleType("")
    setStartDate("")
    setEndDate("")
  }

  if (isError) {
    return (
      <Card className="border-destructive/35 bg-destructive/5 p-8 text-center text-destructive max-w-lg mx-auto my-12">
        <AlertTriangle className="h-10 w-10 mx-auto mb-3" />
        <h3 className="font-bold text-lg">Error Syncing Executive Feed</h3>
        <p className="text-sm mt-1 text-muted-foreground">Could not establish database connection stream. Please refresh or check connection strings.</p>
        <Button variant="outline" className="mt-4 border-destructive/20 text-destructive hover:bg-destructive/10" onClick={() => window.location.reload()}>
          Sync Feed
        </Button>
      </Card>
    )
  }

  // Summary mapping destructures
  const sum = summaryData
  const charts = chartData

  return (
    <div className="space-y-6 text-left">
      
      {/* 1. TOP HEADER & FILTERS */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90">
            {user?.role === "Fleet Manager" && "Executive Fleet Operations"}
            {user?.role === "Dispatcher" && "Dispatcher Operations Console"}
            {user?.role === "Safety Officer" && "Safety & Compliance Audit Dashboard"}
            {user?.role === "Financial Analyst" && "Fleet Profitability & Financials"}
            {!user?.role && "Operations Dashboard"}
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Real-time telemetry, aggregated analytics metrics, and operational ROI insights for role: <strong className="text-primary">{user?.role}</strong>.
          </p>
        </div>

        {/* Global Select Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto bg-card/60 p-3 rounded-2xl border border-border/60">
          {/* Region */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider">Region</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-background border border-border/80 rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              <option value="">All Regions</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>
          </div>

          {/* Vehicle Type */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider">Vehicle Type</span>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="bg-background border border-border/80 rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Trailer">Trailer</option>
              <option value="Container">Container</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-background border border-border/80 rounded-lg px-1.5 py-0.5 text-xs focus:outline-none"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-background border border-border/80 rounded-lg px-1.5 py-0.5 text-xs focus:outline-none"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground self-end"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* 2. LOADING SKELETON GIRD */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-28 bg-muted rounded-2xl" />
          ))}
          <Card className="md:col-span-2 h-[260px] bg-muted rounded-2xl" />
          <Card className="md:col-span-2 h-[260px] bg-muted rounded-2xl" />
        </div>
      )}

      {/* 3. DYNAMIC CONTENT PANEL (ROLE BASED SUMMARY GATES) */}
      {!isLoading && sum && (
        <div className="space-y-6">
          
          {/* ========================================================
              FLEET MANAGER & EXECUTIVE DASHBOARD SUMMARY VIEWS
             ======================================================== */}
          {(user?.role === "Fleet Manager" || !user?.role) && (
            <>
              {/* Executive summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <Card className="border-border/60 bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fleet Utilization</p>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1 font-mono">{sum.vehicles.utilizationPercent}%</h3>
                      <span className="text-[10px] text-muted-foreground block mt-1">Active vs non-retired vehicles</span>
                    </div>
                    <div className="h-11 w-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                      <h3 className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">${sum.financials.totalRevenue.toLocaleString()}</h3>
                      <span className="text-[10px] text-emerald-600 font-bold block mt-1">+{sum.financials.fleetROI}% ROI</span>
                    </div>
                    <div className="h-11 w-11 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Operational Expenses</p>
                      <h3 className="text-2xl font-extrabold text-rose-600 mt-1 font-mono">${sum.financials.totalOperationalCost.toLocaleString()}</h3>
                      <span className="text-[10px] text-muted-foreground block mt-1">Fuel, maint & toll logistics</span>
                    </div>
                    <div className="h-11 w-11 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Trips</p>
                      <h3 className="text-2xl font-extrabold text-blue-600 mt-1 font-mono">{sum.trips.Dispatched}</h3>
                      <span className="text-[10px] text-muted-foreground block mt-1">{sum.trips.Completed} completed recently</span>
                    </div>
                    <div className="h-11 w-11 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                      <Route className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts grid */}
              {charts && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Revenue vs Expenses trend */}
                  <Card className="lg:col-span-2 border-border/60 bg-card">
                    <CardHeader className="border-b border-border/40 pb-4">
                      <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Revenue vs Cost Breakdown (12 Months)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <BarChart
                        data={charts.monthlyTrends.map(t => ({
                          label: t.month,
                          value: t.revenue,
                          secondaryValue: t.totalExpenses,
                        }))}
                        color="#10b981"
                        secondaryColor="#ef4444"
                        showSecondary
                        primaryLabel="Revenue"
                        secondaryLabel="Cost"
                      />
                    </CardContent>
                  </Card>

                  {/* Fleet Utilization Progress */}
                  <Card className="border-border/60 bg-card">
                    <CardHeader className="border-b border-border/40 pb-4">
                      <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Operating Capacity</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 flex flex-col justify-between h-[230px]">
                      <ProgressRing percent={sum.vehicles.utilizationPercent} color="#3b82f6" />
                    </CardContent>
                  </Card>

                  {/* Monthly Trips trend */}
                  <Card className="lg:col-span-2 border-border/60 bg-card">
                    <CardHeader className="border-b border-border/40 pb-4">
                      <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Trip Deployments</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <LineChart
                        data={charts.monthlyTrends.map(t => ({
                          label: t.month,
                          value: t.trips,
                        }))}
                        color="#3b82f6"
                        primaryLabel="Trips Count"
                      />
                    </CardContent>
                  </Card>

                  {/* Vehicle Status Pie */}
                  <Card className="border-border/60 bg-card">
                    <CardHeader className="border-b border-border/40 pb-4">
                      <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Vehicle Registry Split</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 flex items-center justify-center">
                      <PieChart
                        data={[
                          { label: "Available", value: sum.vehicles.available },
                          { label: "On Trip", value: sum.vehicles.active - sum.vehicles.inMaintenance },
                          { label: "In Shop", value: sum.vehicles.inMaintenance },
                          { label: "Retired", value: sum.vehicles.retired },
                        ]}
                        colors={["#10b981", "#3b82f6", "#8b5cf6", "#64748b"]}
                      />
                    </CardContent>
                  </Card>

                  {/* Vehicle ROI Ranking */}
                  <Card className="border-border/60 bg-card">
                    <CardHeader className="border-b border-border/40 pb-4">
                      <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Top Vehicles by ROI (Revenue - Expenses)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <HorizontalBar
                        data={charts.vehicleROI.map(v => ({
                          label: `${v.registrationNumber} (${v.vehicleName})`,
                          value: v.netProfit,
                        }))}
                        color="#10b981"
                      />
                    </CardContent>
                  </Card>

                  {/* Top Fuel consuming vehicles */}
                  <Card className="border-border/60 bg-card">
                    <CardHeader className="border-b border-border/40 pb-4">
                      <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Top Fuel Consuming Vehicles</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <BarChart
                        data={charts.topFuelVehicles.map(v => ({
                          label: v.registrationNumber,
                          value: v.liters,
                        }))}
                        color="#f59e0b"
                        primaryLabel="Liters Fuel"
                      />
                    </CardContent>
                  </Card>

                  {/* Maintenance type distribution */}
                  <Card className="border-border/60 bg-card">
                    <CardHeader className="border-b border-border/40 pb-4">
                      <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Maintenance Type Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 flex items-center justify-center">
                      <PieChart
                        data={charts.maintenanceDistribution.map(m => ({
                          label: m.type,
                          value: m.count,
                        }))}
                      />
                    </CardContent>
                  </Card>

                </div>
              )}
            </>
          )}

          {/* ========================================================
              DISPATCHER DASHBOARD SUMMARY VIEWS
             ======================================================== */}
          {user?.role === "Dispatcher" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/60 bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Available Vehicles</p>
                      <h3 className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">{sum.vehicles.available}</h3>
                    </div>
                    <div className="h-11 w-11 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                      <Truck className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Available Drivers</p>
                      <h3 className="text-2xl font-extrabold text-blue-600 mt-1 font-mono">{sum.drivers.available}</h3>
                    </div>
                    <div className="h-11 w-11 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Dispatched Trips</p>
                      <h3 className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">{sum.trips.Dispatched}</h3>
                    </div>
                    <div className="h-11 w-11 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                      <Route className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Draft Trips</p>
                      <h3 className="text-2xl font-extrabold text-slate-600 mt-1 font-mono">{sum.trips.Draft}</h3>
                    </div>
                    <div className="h-11 w-11 bg-slate-500/10 text-slate-500 rounded-xl flex items-center justify-center">
                      <Layers className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border/60 bg-card">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Trips Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 flex justify-center">
                    <PieChart
                      data={[
                        { label: "Draft", value: sum.trips.Draft },
                        { label: "Dispatched", value: sum.trips.Dispatched },
                        { label: "Completed", value: sum.trips.Completed },
                        { label: "Cancelled", value: sum.trips.Cancelled },
                      ]}
                      colors={["#64748b", "#3b82f6", "#10b981", "#ef4444"]}
                    />
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Vehicle Operating Split</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 flex justify-center">
                    <PieChart
                      data={[
                        { label: "Available", value: sum.vehicles.available },
                        { label: "On Trip", value: sum.vehicles.active - sum.vehicles.inMaintenance },
                        { label: "In Shop", value: sum.vehicles.inMaintenance },
                      ]}
                      colors={["#10b981", "#3b82f6", "#8b5cf6"]}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* ========================================================
              SAFETY OFFICER DASHBOARD SUMMARY VIEWS
             ======================================================== */}
          {user?.role === "Safety Officer" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/60 bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vehicles In Maintenance</p>
                      <h3 className="text-2xl font-extrabold text-red-600 mt-1 font-mono">{sum.vehicles.inMaintenance}</h3>
                    </div>
                    <div className="h-11 w-11 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                      <Wrench className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Drivers Suspended</p>
                      <h3 className="text-2xl font-extrabold text-rose-600 mt-1 font-mono">{sum.drivers.suspended}</h3>
                    </div>
                    <div className="h-11 w-11 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fleet Document Expiries</p>
                      <h3 className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">Scan Alerts</h3>
                    </div>
                    <div className="h-11 w-11 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* ========================================================
              FINANCIAL ANALYST DASHBOARD SUMMARY VIEWS
             ======================================================== */}
          {user?.role === "Financial Analyst" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/60 bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fuel Cost Total</p>
                      <h3 className="text-xl font-extrabold text-rose-600 mt-1 font-mono">${sum.financials.totalFuelCost.toLocaleString()}</h3>
                    </div>
                    <div className="h-11 w-11 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center">
                      <Fuel className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Maintenance Expenses</p>
                      <h3 className="text-xl font-extrabold text-rose-600 mt-1 font-mono">${sum.financials.totalMaintenanceCost.toLocaleString()}</h3>
                    </div>
                    <div className="h-11 w-11 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center">
                      <Wrench className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Operational Profit</p>
                      <h3 className="text-xl font-extrabold text-emerald-600 mt-1 font-mono">${sum.financials.netProfit.toLocaleString()}</h3>
                    </div>
                    <div className="h-11 w-11 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Average Fuel Efficiency</p>
                      <h3 className="text-xl font-extrabold text-blue-600 mt-1 font-mono">{sum.financials.avgFuelEfficiency} mi/L</h3>
                    </div>
                    <div className="h-11 w-11 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                      <Zap className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {charts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-border/60 bg-card">
                    <CardHeader className="border-b border-border/40 pb-4">
                      <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Monthly Fuel Expense Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <LineChart
                        data={charts.monthlyTrends.map(t => ({
                          label: t.month,
                          value: t.fuelCost,
                        }))}
                        color="#f59e0b"
                        primaryLabel="Fuel Cost"
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 bg-card">
                    <CardHeader className="border-b border-border/40 pb-4">
                      <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Top Vehicles Profitability ROI</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <HorizontalBar
                        data={charts.vehicleROI.slice(0, 5).map(v => ({
                          label: `${v.registrationNumber} (${v.vehicleName})`,
                          value: v.netProfit,
                        }))}
                        color="#10b981"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* ========================================================
              QUICK ACTIONS PANEL (Manager, Dispatcher, Safety & Finance)
             ======================================================== */}
          <Card className="border-border/60 bg-card shadow-sm">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-4.5 w-4.5 text-primary" /> Operations Shortcuts & Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                
                {/* 1. Add Vehicle */}
                {(user?.role === "Fleet Manager" || user?.role === "Dispatcher" || user?.role === "Safety Officer") && (
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-1.5 h-auto py-3 text-xs border-border/80 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
                    onClick={() => navigate("/vehicles")}
                  >
                    <PlusCircle className="h-5.5 w-5.5" />
                    <span>Add Vehicle</span>
                  </Button>
                )}

                {/* 2. Add Driver */}
                {(user?.role === "Fleet Manager" || user?.role === "Dispatcher" || user?.role === "Safety Officer") && (
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-1.5 h-auto py-3 text-xs border-border/80 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
                    onClick={() => navigate("/drivers")}
                  >
                    <PlusCircle className="h-5.5 w-5.5" />
                    <span>Add Driver</span>
                  </Button>
                )}

                {/* 3. Create Trip */}
                {(user?.role === "Fleet Manager" || user?.role === "Dispatcher") && (
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-1.5 h-auto py-3 text-xs border-border/80 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
                    onClick={() => navigate("/trips")}
                  >
                    <PlusCircle className="h-5.5 w-5.5" />
                    <span>Create Trip</span>
                  </Button>
                )}

                {/* 4. Log Maintenance */}
                {(user?.role === "Fleet Manager" || user?.role === "Safety Officer" || user?.role === "Financial Analyst") && (
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-1.5 h-auto py-3 text-xs border-border/80 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
                    onClick={() => navigate("/maintenance")}
                  >
                    <PlusCircle className="h-5.5 w-5.5" />
                    <span>Log Service</span>
                  </Button>
                )}

                {/* 5. Log Fuel */}
                {(user?.role === "Fleet Manager" || user?.role === "Financial Analyst") && (
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-1.5 h-auto py-3 text-xs border-border/80 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
                    onClick={() => navigate("/fuel-logs")}
                  >
                    <PlusCircle className="h-5.5 w-5.5" />
                    <span>Log Fuel</span>
                  </Button>
                )}

                {/* 6. Log Expense */}
                {(user?.role === "Fleet Manager" || user?.role === "Financial Analyst") && (
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-1.5 h-auto py-3 text-xs border-border/80 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
                    onClick={() => navigate("/expenses")}
                  >
                    <PlusCircle className="h-5.5 w-5.5" />
                    <span>Log Expense</span>
                  </Button>
                )}

              </div>
            </CardContent>
          </Card>

          {/* ========================================================
              ALERTS PANEL
             ======================================================== */}
          {alertData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* COMPLIANCE WARNINGS */}
              <Card className="border-border/60 bg-card">
                <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-500" /> Compliance Warnings & Expiries
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-64 overflow-y-auto divide-y divide-border/40 text-xs">
                    
                    {/* Expiring Drivers */}
                    {alertData.expiringDrivers.length === 0 && alertData.expiringVehicles.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">No expiring documents or license flags logged.</div>
                    )}
                    
                    {alertData.expiringDrivers.map((d: any, idx: number) => (
                      <div key={`d-${idx}`} className="p-3.5 flex items-start gap-3 hover:bg-muted/10 transition-colors">
                        <AlertTriangle className="h-4.5 w-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-foreground/90">License Expiry Warning: {d.fullName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Employee ID: {d.employeeId} &bull; Expiry Date: <span className="font-bold text-rose-500">{formatDate(d.licenseExpiry)}</span>
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Expiring Vehicle Documents */}
                    {alertData.expiringVehicles.map((v: any, idx: number) => {
                      const todayTime = new Date().getTime()
                      const insExp = v.insuranceExpiry ? new Date(v.insuranceExpiry).getTime() : null
                      const fitExp = v.fitnessExpiry ? new Date(v.fitnessExpiry).getTime() : null
                      const polExp = v.pollutionExpiry ? new Date(v.pollutionExpiry).getTime() : null

                      return (
                        <div key={`v-${idx}`} className="p-3.5 flex items-start gap-3 hover:bg-muted/10 transition-colors">
                          <AlertTriangle className="h-4.5 w-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-foreground/90">Document Expiry Alert: {v.registrationNumber} ({v.vehicleName})</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                              {insExp && insExp <= todayTime + 30 * 24 * 60 * 60 * 1000 && (
                                <span>Insurance: <strong className="text-rose-500">{formatDate(v.insuranceExpiry)}</strong> &bull; </span>
                              )}
                              {fitExp && fitExp <= todayTime + 30 * 24 * 60 * 60 * 1000 && (
                                <span>Fitness Cert: <strong className="text-rose-500">{formatDate(v.fitnessExpiry)}</strong> &bull; </span>
                              )}
                              {polExp && polExp <= todayTime + 30 * 24 * 60 * 60 * 1000 && (
                                <span>Pollution Cert: <strong className="text-rose-500">{formatDate(v.pollutionExpiry)}</strong></span>
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* CRITICAL ALERTS (In shop, low safety score) */}
              <Card className="border-border/60 bg-card">
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4.5 w-4.5 text-primary" /> Active Safety & Cost Audit Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-64 overflow-y-auto divide-y divide-border/40 text-xs">
                    
                    {alertData.vehiclesInShop.length === 0 && alertData.lowSafetyDrivers.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">All driver scores and vehicle logistics are currently green.</div>
                    )}

                    {/* Low Safety Score Drivers */}
                    {alertData.lowSafetyDrivers.map((d: any, idx: number) => (
                      <div key={`ls-${idx}`} className="p-3.5 flex items-start gap-3 hover:bg-muted/10 transition-colors">
                        <AlertTriangle className="h-4.5 w-4.5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-foreground/90">Critical Safety Warning: {d.fullName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Employee ID: {d.employeeId} &bull; Safety Score: <span className="font-extrabold text-rose-600">{d.safetyScore}/100</span> (Requires review)
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Vehicles Currently In Shop */}
                    {alertData.vehiclesInShop.map((v: any, idx: number) => (
                      <div key={`vis-${idx}`} className="p-3.5 flex items-start gap-3 hover:bg-muted/10 transition-colors">
                        <Info className="h-4.5 w-4.5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-foreground/90">Vehicle Currently in Shop: {v.registrationNumber}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Name: {v.vehicleName} &bull; Odometer: {v.currentOdometer.toLocaleString()} miles &bull; Region: {v.region}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* ========================================================
              RECENT ACTIVITY TABLES
             ======================================================== */}
          {activityData && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* RECENT TRIPS */}
              <Card className="border-border/60 bg-card">
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Recent Trip Logs</span>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/trips")} className="h-7 text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                      View all <ArrowRight className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground font-extrabold uppercase tracking-wider border-b border-border/30">
                        <tr>
                          <th className="p-3">Trip ID</th>
                          <th className="p-3">Route</th>
                          <th className="p-3">Vehicle</th>
                          <th className="p-3">Driver</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {activityData.recentTrips.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-muted-foreground">No trips created yet.</td>
                          </tr>
                        ) : (
                          activityData.recentTrips.map((t: any) => (
                            <tr key={t._id} className="hover:bg-muted/10 transition-colors">
                              <td className="p-3 font-mono font-bold">{t.tripNumber}</td>
                              <td className="p-3">
                                <span className="font-semibold text-foreground/80">{t.source}</span>
                                <span className="text-[9px] text-muted-foreground block">to {t.destination}</span>
                              </td>
                              <td className="p-3">{t.vehicle?.registrationNumber || "N/A"}</td>
                              <td className="p-3 font-medium">{t.driver?.fullName || "N/A"}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                  t.status === "Completed" ? "bg-emerald-100 text-emerald-800" :
                                  t.status === "Dispatched" ? "bg-blue-100 text-blue-800" :
                                  t.status === "Draft" ? "bg-slate-100 text-slate-800" :
                                  "bg-rose-100 text-rose-800"
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* RECENT MAINTENANCE */}
              <Card className="border-border/60 bg-card">
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Recent Servicing Tasks</span>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/maintenance")} className="h-7 text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                      View all <ArrowRight className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground font-extrabold uppercase tracking-wider border-b border-border/30">
                        <tr>
                          <th className="p-3">Task ID</th>
                          <th className="p-3">Vehicle</th>
                          <th className="p-3">Service Type</th>
                          <th className="p-3">Vendor</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {activityData.recentMaintenance.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-muted-foreground">No maintenance logged yet.</td>
                          </tr>
                        ) : (
                          activityData.recentMaintenance.map((m: any) => (
                            <tr key={m._id} className="hover:bg-muted/10 transition-colors">
                              <td className="p-3 font-mono font-bold text-primary hover:underline cursor-pointer" onClick={() => navigate(`/maintenance/${m._id}`)}>
                                {m.maintenanceId}
                              </td>
                              <td className="p-3">{m.vehicle?.registrationNumber || "N/A"}</td>
                              <td className="p-3 font-semibold">{m.maintenanceType}</td>
                              <td className="p-3">{m.vendor}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                  m.status === "Completed" ? "bg-emerald-100 text-emerald-800" :
                                  m.status === "Active" ? "bg-blue-100 text-blue-800" :
                                  m.status === "Scheduled" ? "bg-slate-100 text-slate-800" :
                                  "bg-rose-100 text-rose-800"
                                }`}>
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* RECENT FUEL LOGS */}
              <Card className="border-border/60 bg-card">
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Recent Fuel Receipts</span>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/fuel-logs")} className="h-7 text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                      View all <ArrowRight className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground font-extrabold uppercase tracking-wider border-b border-border/30">
                        <tr>
                          <th className="p-3">Log ID</th>
                          <th className="p-3">Vehicle</th>
                          <th className="p-3">Liters</th>
                          <th className="p-3">Total Cost</th>
                          <th className="p-3">Purchase Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {activityData.recentFuelLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-muted-foreground">No fuel records logged yet.</td>
                          </tr>
                        ) : (
                          activityData.recentFuelLogs.map((f: any) => (
                            <tr key={f._id} className="hover:bg-muted/10 transition-colors">
                              <td className="p-3 font-mono font-bold">{f.fuelLogId}</td>
                              <td className="p-3">{f.vehicle?.registrationNumber || "N/A"}</td>
                              <td className="p-3 font-mono">{f.liters} L</td>
                              <td className="p-3 font-mono font-semibold">${f.cost.toFixed(2)}</td>
                              <td className="p-3 text-muted-foreground">{formatDate(f.fuelDate)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* RECENT EXPENSES */}
              <Card className="border-border/60 bg-card">
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Recent Toll & Expense Logs</span>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/expenses")} className="h-7 text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                      View all <ArrowRight className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground font-extrabold uppercase tracking-wider border-b border-border/30">
                        <tr>
                          <th className="p-3">Expense ID</th>
                          <th className="p-3">Vehicle</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Billing Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {activityData.recentExpenses.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-muted-foreground">No operational expenses logged yet.</td>
                          </tr>
                        ) : (
                          activityData.recentExpenses.map((e: any) => (
                            <tr key={e._id} className="hover:bg-muted/10 transition-colors">
                              <td className="p-3 font-mono font-bold">{e.expenseId}</td>
                              <td className="p-3">{e.vehicle?.registrationNumber || "N/A"}</td>
                              <td className="p-3 font-semibold">{e.expenseType}</td>
                              <td className="p-3 font-mono font-semibold">${e.amount.toFixed(2)}</td>
                              <td className="p-3 text-muted-foreground">{formatDate(e.expenseDate)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

        </div>
      )}

    </div>
  )
}
