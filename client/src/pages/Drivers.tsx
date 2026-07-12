import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Plus, Search, Filter } from "lucide-react"

export default function Drivers() {
  const dummyDrivers = [
    { id: "D001", name: "Sarah Connor", license: "CDL-A-9812", phone: "+1 555-0192", status: "Available" },
    { id: "D002", name: "Marcus Wright", license: "CDL-A-2283", phone: "+1 555-0144", status: "On-Trip" },
    { id: "D003", name: "John Connor", license: "CDL-B-7729", phone: "+1 555-0182", status: "Off-Duty" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Drivers</h1>
          <p className="text-muted-foreground mt-1">Manage personnel records, licenses, compliance, and duty cycles.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Driver
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search drivers by name, license number..."
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Driver Directory</CardTitle>
          <CardDescription>A list of qualified operating drivers and compliance statuses.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 rounded-l-lg">ID</th>
                <th className="p-4">Driver Name</th>
                <th className="p-4">License Type</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4 border-border">Status</th>
                <th className="p-4 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {dummyDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-medium">{driver.id}</td>
                  <td className="p-4 font-semibold text-foreground/80">{driver.name}</td>
                  <td className="p-4 font-mono text-xs">{driver.license}</td>
                  <td className="p-4 text-muted-foreground">{driver.phone}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      driver.status === "Available" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
                      driver.status === "On-Trip" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
                      "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                    }`}>
                      {driver.status}
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
