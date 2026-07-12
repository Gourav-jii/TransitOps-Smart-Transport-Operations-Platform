import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Plus, Fuel } from "lucide-react"

export default function FuelLogs() {
  const dummyLogs = [
    { id: "FL-501", vehicle: "TX-9281", driver: "Sarah Connor", volume: "85 Gallons", cost: "$280.50", station: "Shell Station #12" },
    { id: "FL-502", vehicle: "NY-7729", driver: "John Connor", volume: "110 Gallons", cost: "$363.00", station: "Chevron Auto" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Fuel Logs</h1>
          <p className="text-muted-foreground mt-1">Record refuel transactions, trace fuel cards, and audit fuel efficiency.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Refuel Log
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Recent Fuel Transactions</CardTitle>
          <CardDescription>Audited fuel purchases logged by fleet operators.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 rounded-l-lg">Log ID</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Driver</th>
                <th className="p-4">Fuel Volume</th>
                <th className="p-4">Total Cost</th>
                <th className="p-4 border-border">Station Location</th>
                <th className="p-4 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {dummyLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-semibold text-primary">{log.id}</td>
                  <td className="p-4 font-mono font-bold text-xs">{log.vehicle}</td>
                  <td className="p-4 font-medium">{log.driver}</td>
                  <td className="p-4 flex items-center gap-1">
                    <Fuel className="h-3 w-3 text-muted-foreground" />
                    {log.volume}
                  </td>
                  <td className="p-4 font-semibold">{log.cost}</td>
                  <td className="p-4 text-muted-foreground text-xs">{log.station}</td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm">Details</Button>
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
