import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Plus, Wrench } from "lucide-react"

export default function Maintenance() {
  const maintenanceTasks = [
    { id: "M-101", vehicle: "TX-9281", type: "Engine Service", cost: "$450.00", date: "2026-07-15", priority: "High" },
    { id: "M-102", vehicle: "CA-4819", type: "Tire Rotation", cost: "$120.00", date: "2026-07-18", priority: "Medium" },
    { id: "M-103", vehicle: "NY-7729", type: "Brake Inspection", cost: "$320.00", date: "2026-07-22", priority: "Low" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Maintenance</h1>
          <p className="text-muted-foreground mt-1">Schedule servicing, track preventative maintenance, and manage repair logs.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Log Service
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Upcoming Maintenance & Repair Tasks</CardTitle>
          <CardDescription>Keep fleet vehicles running in top condition with structured schedules.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 rounded-l-lg">ID</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Service Type</th>
                <th className="p-4">Est. Cost</th>
                <th className="p-4">Target Date</th>
                <th className="p-4">Priority</th>
                <th className="p-4 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {maintenanceTasks.map((task) => (
                <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-semibold text-primary">{task.id}</td>
                  <td className="p-4 font-mono font-bold text-xs">{task.vehicle}</td>
                  <td className="p-4 flex items-center gap-2">
                    <Wrench className="h-3 w-3 text-muted-foreground" />
                    {task.type}
                  </td>
                  <td className="p-4 font-semibold">{task.cost}</td>
                  <td className="p-4 text-muted-foreground text-xs">{task.date}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      task.priority === "High" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
                      task.priority === "Medium" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm">Perform</Button>
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
