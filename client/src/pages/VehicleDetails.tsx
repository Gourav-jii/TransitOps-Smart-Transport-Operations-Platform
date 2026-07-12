import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import vehicleService from "@/services/vehicleService"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Loading } from "@/components/ui/Loading"
import {
  ArrowLeft,
  Truck,
  Calendar,
  Layers,
  Wrench,
  Fuel,
  DollarSign,
  Info,
  Clock,
  Shield,
  Activity,
  MapPin,
  Scale,
} from "lucide-react"

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"profile" | "trips" | "fuel" | "maintenance" | "expenses">("profile")

  // React Query: Fetch single vehicle details
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => vehicleService.getVehicleById(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <Card className="border-border/60 p-12">
        <Loading size="lg" label="Retrieving vehicle specifications..." />
      </Card>
    )
  }

  if (isError || !data?.success) {
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

  const vehicle = data.data

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
    return `$${val.toLocaleString()}`
  }

  // Configuration for tabs
  const tabs = [
    { id: "profile", label: "Profile Specs", icon: Info },
    { id: "trips", label: "Trip History", icon: Activity },
    { id: "fuel", label: "Fuel Logs", icon: Fuel },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "expenses", label: "Expenses", icon: DollarSign },
  ] as const;

  return (
    <div className="space-y-6">
      
      {/* HEADER NAVIGATION BAR */}
      <div className="flex items-center gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
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
                  <span>Registered: {formatDate(vehicle.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Updated: {formatDate(vehicle.updatedAt)}</span>
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

                {/* Remarks/Notes spans full width */}
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

            {/* TAB PLACEHOLDERS FOR FUTURE WORK */}
            {activeTab !== "profile" && (
              <Card className="border-border/60 p-16 text-center rounded-xl bg-card">
                <div className="h-14 w-14 bg-muted text-muted-foreground/45 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Layers className="h-6 w-6 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold">Future Integrations</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                  The {tabs.find((t) => t.id === activeTab)?.label} details are protected placeholders for Phase 4 validation.
                </p>
                <div className="mt-6 flex justify-center gap-4">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("profile")}>
                    Back to Profile
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
