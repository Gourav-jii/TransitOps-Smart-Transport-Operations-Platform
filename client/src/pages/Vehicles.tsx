import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Plus, Search, Filter } from "lucide-react"

export default function Vehicles() {
  const dummyVehicles = [
    { id: "V001", plate: "TX-9281", type: "Heavy Duty Truck", model: "Volvo FH16", status: "Active" },
    { id: "V002", plate: "CA-4819", type: "Light Cargo Van", model: "Mercedes Sprinter", status: "Maintenance" },
    { id: "V003", plate: "NY-7729", type: "Reefer Truck", model: "Scania R500", status: "Active" },
    { id: "V004", plate: "FL-3382", type: "Flatbed Trailer", model: "Peterbilt 579", status: "In-Transit" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Vehicles</h1>
          <p className="text-muted-foreground mt-1">Manage fleet registry, status updates, and assignment logs.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vehicles by plate, model, type..."
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Fleet Registry</CardTitle>
          <CardDescription>A live list of all trucks, trailers, and vans registered in TransitOps.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 rounded-l-lg">ID</th>
                <th className="p-4">License Plate</th>
                <th className="p-4">Type</th>
                <th className="p-4">Model</th>
                <th className="p-4">Status</th>
                <th className="p-4 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {dummyVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-medium">{vehicle.id}</td>
                  <td className="p-4 font-mono font-bold text-primary">{vehicle.plate}</td>
                  <td className="p-4">{vehicle.type}</td>
                  <td className="p-4">{vehicle.model}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      vehicle.status === "Active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
                      vehicle.status === "Maintenance" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    }`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm">Manage</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
