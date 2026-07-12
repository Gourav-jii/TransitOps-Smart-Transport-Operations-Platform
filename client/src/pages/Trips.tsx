import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Plus, Navigation } from "lucide-react"

export default function Trips() {
  const dummyTrips = [
    { id: "T-990", route: "New York, NY ➔ Boston, MA", vehicle: "TX-9281", driver: "Sarah Connor", eta: "11:40 AM", status: "In Transit" },
    { id: "T-991", route: "Los Angeles, CA ➔ Phoenix, AZ", vehicle: "FL-3382", driver: "Marcus Wright", eta: "02:15 PM", status: "Delayed" },
    { id: "T-992", route: "Miami, FL ➔ Atlanta, GA", vehicle: "NY-7729", driver: "John Connor", eta: "Completed", status: "Delivered" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Trips</h1>
          <p className="text-muted-foreground mt-1">Dispatch cargo loads, track active route coordinates, and verify ETAs.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Trip Dispatch
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Active Dispatch Board</CardTitle>
          <CardDescription>Live routing information and delivery milestones.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 rounded-l-lg">Trip ID</th>
                <th className="p-4">Dispatch Route</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Assigned Driver</th>
                <th className="p-4">ETA / Arrival</th>
                <th className="p-4 border-border">Status</th>
                <th className="p-4 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {dummyTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-semibold text-primary">{trip.id}</td>
                  <td className="p-4 flex items-center gap-2 font-medium">
                    <Navigation className="h-3 w-3 text-muted-foreground rotate-45" />
                    {trip.route}
                  </td>
                  <td className="p-4 font-mono font-bold text-xs">{trip.vehicle}</td>
                  <td className="p-4">{trip.driver}</td>
                  <td className="p-4 text-muted-foreground text-xs">{trip.eta}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      trip.status === "In Transit" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
                      trip.status === "Delayed" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm">Track</Button>
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
