import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import tripService from "@/services/tripService"
import { type VehicleData } from "@/services/vehicleService"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Loading } from "@/components/ui/Loading"
import {
  ArrowLeft,
  Route,
  Truck,
  User as UserIcon,
  Calendar,
  CheckCircle,
  XCircle,
  DollarSign,
  Info,
  Clock,
  Shield,
  MapPin,
  Scale,
  Gauge,
  Droplet,
} from "lucide-react"

export default function TripDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Fetch trip by ID
  const { data, isLoading, isError } = useQuery({
    queryKey: ["trip", id],
    queryFn: () => tripService.getTripById(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <Card className="border-border/60 p-12">
        <Loading size="lg" label="Retrieving trip dispatch telemetry..." />
      </Card>
    )
  }

  if (isError || !data?.success) {
    return (
      <div className="space-y-4 max-w-lg mx-auto text-center py-12">
        <div className="p-4 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 w-fit mx-auto">
          <Info className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold">Trip Log Not Found</h2>
        <p className="text-muted-foreground text-sm">
          The requested trip dispatch log ID is invalid or has been deleted from the registry.
        </p>
        <Button onClick={() => navigate("/trips")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dispatch Panel
        </Button>
      </div>
    )
  }

  const trip = data.data
  const vehicle = trip.vehicle as VehicleData | undefined
  const driver = trip.driver as { fullName: string; licenseNumber: string; licenseCategory: string; contactNumber: string } | undefined

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCost = (val?: number) => {
    if (val === undefined || val === null) return "—"
    return `$${val.toLocaleString()}`
  }

  // Helper to determine status color tags
  const getStatusBadgeClass = () => {
    switch (trip.status) {
      case "Draft":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400 border-slate-200"
      case "Dispatched":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200"
      case "Completed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200"
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-red-200"
    }
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/trips")} className="h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight font-mono">{trip.tripNumber}</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusBadgeClass()}`}>
              {trip.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Route: {trip.source} &rarr; {trip.destination}
          </p>
        </div>
      </div>

      {/* TRIP STATUS LIFECYCLE TIMELINE */}
      <Card className="border-border/60 shadow-sm bg-card overflow-hidden text-left">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Trip Dispatch Lifecycle Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4 max-w-4xl mx-auto relative">
            
            {/* Step 1: Created (Draft) */}
            <div className="flex items-center gap-3 md:flex-col md:text-center flex-1 relative z-10">
              <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Booked (Draft)</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(trip.createdAt)}</p>
                {trip.createdBy && (
                  <p className="text-[9px] text-primary/80 font-medium">By: {trip.createdBy.name}</p>
                )}
              </div>
            </div>

            <div className="hidden md:block flex-1 h-[2px] bg-border" />

            {/* Step 2: Dispatched */}
            <div className="flex items-center gap-3 md:flex-col md:text-center flex-1 relative z-10">
              <div className={`h-9 w-9 rounded-full border flex items-center justify-center font-bold text-sm ${
                trip.status !== "Draft"
                  ? "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-300"
                  : "bg-background text-muted-foreground border-border"
              }`}>
                2
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Dispatched</p>
                {trip.status !== "Draft" ? (
                  <>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(trip.dispatchedAt)}</p>
                    {trip.dispatchedBy && (
                      <p className="text-[9px] text-primary/80 font-medium">By: {trip.dispatchedBy.name}</p>
                    )}
                  </>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-0.5">Pending Dispatch</p>
                )}
              </div>
            </div>

            <div className="hidden md:block flex-1 h-[2px] bg-border" />

            {/* Step 3: Finished / Cancelled */}
            <div className="flex items-center gap-3 md:flex-col md:text-center flex-1 relative z-10">
              <div className={`h-9 w-9 rounded-full border flex items-center justify-center font-bold text-sm ${
                trip.status === "Completed"
                  ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300"
                  : trip.status === "Cancelled"
                  ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-300"
                  : "bg-background text-muted-foreground border-border"
              }`}>
                3
              </div>
              <div>
                {trip.status === "Cancelled" ? (
                  <>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">Cancelled</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(trip.cancelledAt)}</p>
                    {trip.cancelledBy && (
                      <p className="text-[9px] text-primary/80 font-medium">By: {trip.cancelledBy.name}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-foreground">Route Completed</p>
                    {trip.status === "Completed" ? (
                      <>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(trip.completedDate)}</p>
                        {trip.completedBy && (
                          <p className="text-[9px] text-primary/80 font-medium">By: {trip.completedBy.name}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-0.5">Pending Completion</p>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* CORE SPEC DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* COLUMN 1: ROUTE & CARGO DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Route Specs */}
          <Card className="border-border/60 shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Route className="h-4.5 w-4.5 text-primary" /> Route Telemetry & Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="border-b border-border/30 pb-2.5 sm:border-b-0 sm:pb-0">
                <p className="text-xs text-muted-foreground font-semibold">Planned Start Date</p>
                <p className="font-semibold text-foreground mt-1 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" /> {formatDate(trip.plannedStartDate)}
                </p>
              </div>
              <div className="border-b border-border/30 pb-2.5 sm:border-b-0 sm:pb-0">
                <p className="text-xs text-muted-foreground font-semibold">Expected Completion Date</p>
                <p className="font-semibold text-foreground mt-1 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" /> {formatDate(trip.expectedCompletionDate)}
                </p>
              </div>
              <div className="border-b border-border/30 pb-2.5 sm:border-b-0 sm:pb-0">
                <p className="text-xs text-muted-foreground font-semibold">Cargo Load Weight</p>
                <p className="font-semibold text-foreground mt-1 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-muted-foreground" /> {trip.cargoWeight.toLocaleString()} kg
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Planned Distance</p>
                <p className="font-semibold text-foreground mt-1 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> {trip.plannedDistance?.toLocaleString()} km
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Financial Telemetry */}
          <Card className="border-border/60 shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4.5 w-4.5 text-primary" /> Financial Estimates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="border-b border-border/30 pb-2.5 sm:border-b-0 sm:pb-0">
                <p className="text-xs text-muted-foreground font-semibold">Estimated Revenue</p>
                <p className="font-mono font-bold text-lg text-foreground mt-1">
                  {formatCost(trip.estimatedRevenue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Actual Settlement Revenue</p>
                <p className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400 mt-1">
                  {trip.status === "Completed" ? formatCost(trip.revenue || trip.estimatedRevenue) : "Pending Completion"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Completion telemetry (visible only if Completed) */}
          {trip.status === "Completed" && (
            <Card className="border-border/60 shadow-sm bg-card border-emerald-500/10 dark:border-emerald-500/20">
              <CardHeader className="pb-3 border-b border-border/40 bg-emerald-500/5">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="h-4.5 w-4.5" /> Route Completion Log Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Actual Distance Travelled</p>
                  <p className="font-semibold text-foreground mt-1 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" /> {trip.actualDistance?.toLocaleString()} km
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Ending Odometer</p>
                  <p className="font-semibold text-foreground mt-1 flex items-center gap-1.5">
                    <Gauge className="h-4 w-4 text-muted-foreground" /> {trip.endingOdometer?.toLocaleString()} km
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Fuel Consumed</p>
                  <p className="font-semibold text-foreground mt-1 flex items-center gap-1.5">
                    <Droplet className="h-4 w-4 text-muted-foreground" /> {trip.fuelConsumed?.toLocaleString()} Liters
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card 4: Cancellation Reason (visible only if Cancelled) */}
          {trip.status === "Cancelled" && (
            <Card className="border-red-500/20 bg-red-500/5 shadow-sm text-left">
              <CardContent className="p-4 flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Cancellation Log Detail</h4>
                  <p className="text-sm text-red-700 dark:text-red-300 italic">
                    "{trip.cancellationReason || "No cancellation reason provided."}"
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card 5: Remarks */}
          <Card className="border-border/60 shadow-sm bg-card">
            <CardContent className="p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Route & Remarks Summary</h4>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {trip.remarks || "No remarks or special dispatcher routing notes entered."}
              </p>
            </CardContent>
          </Card>

        </div>

        {/* COLUMN 2: ASSIGNED VEHICLE & DRIVER STACK */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card 1: Assigned Vehicle */}
          <Card className="border-border/60 shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-primary" /> Assigned Fleet Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm space-y-3">
              {vehicle ? (
                <>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">Plate No</span>
                    <Link
                      to={`/vehicles/${vehicle._id}`}
                      className="font-mono font-bold text-primary hover:underline"
                    >
                      {vehicle.registrationNumber}
                    </Link>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">Vehicle Name</span>
                    <span className="font-semibold">{vehicle.vehicleName}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">Model / Type</span>
                    <span className="text-xs font-semibold">{vehicle.manufacturer} {vehicle.model}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">Odometer (Start)</span>
                    <span className="font-mono font-semibold">{trip.startingOdometer.toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Max Capacity</span>
                    <span className="font-mono font-semibold">{vehicle.maximumLoadCapacity?.toLocaleString()} kg</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">No vehicle data resolved.</p>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Assigned Driver */}
          <Card className="border-border/60 shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <UserIcon className="h-4.5 w-4.5 text-primary" /> Assigned Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm space-y-3">
              {driver ? (
                <>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">Driver Name</span>
                    <span className="font-semibold">{driver.fullName}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">License No</span>
                    <span className="font-mono text-xs font-semibold">{driver.licenseNumber}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">License Category</span>
                    <span className="text-xs font-semibold">{driver.licenseCategory}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Contact No</span>
                    <span className="text-xs font-semibold text-muted-foreground">{driver.contactNumber}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">No driver data resolved.</p>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Auditor Stamp */}
          <Card className="border-border/60 shadow-sm bg-card text-xs text-muted-foreground">
            <CardContent className="p-4 space-y-2.5">
              <h4 className="font-bold uppercase tracking-wider text-foreground/80 border-b border-border/30 pb-1.5 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" /> Security Dispatch Audit
              </h4>
              <div className="flex items-center justify-between">
                <span>Booked By</span>
                <span className="font-semibold text-foreground/80">{trip.createdBy?.name || "System"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Dispatcher User</span>
                <span className="font-semibold text-foreground/80">{trip.dispatchedBy?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Completed By</span>
                <span className="font-semibold text-foreground/80">{trip.completedBy?.name || "—"}</span>
              </div>
              {trip.cancelledBy && (
                <div className="flex items-center justify-between">
                  <span>Cancelled By</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{trip.cancelledBy.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )
}
