import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { ShieldAlert, Truck, Users, Route, DollarSign, Activity } from "lucide-react"

export default function Dashboard() {
  const stats = [
    { label: "Total Fleet", value: "148", change: "+12% vs last month", icon: Truck, color: "text-blue-600 dark:text-blue-400" },
    { label: "Active Drivers", value: "98", change: "92% utilization rate", icon: Users, color: "text-teal-600 dark:text-teal-400" },
    { label: "Current Trips", value: "32", change: "5 in-transit delay alerts", icon: Route, color: "text-indigo-600 dark:text-indigo-400" },
    { label: "Monthly Expenses", value: "$45,280", change: "-4% vs last month", icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time overview of fleet operations, metrics, and alerts.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-sans">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border/60">
          <CardHeader>
            <CardTitle>Fleet Operations Health</CardTitle>
            <CardDescription>Visual metrics and fleet activity graphs will be displayed here in Phase 2.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl m-6 mt-0">
            <div className="text-center space-y-2">
              <Activity className="h-10 w-10 text-muted-foreground/40 mx-auto animate-pulse" />
              <p className="text-sm font-medium text-muted-foreground">Operating Metrics Engine Ready</p>
              <p className="text-xs text-muted-foreground/70">Awaiting database connection integration.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border/60">
          <CardHeader>
            <CardTitle>Critical Notifications</CardTitle>
            <CardDescription>Required action for vehicles and drivers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-3 rounded-lg bg-destructive/10 dark:bg-destructive/20 border border-destructive/25">
              <ShieldAlert className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive-foreground dark:text-red-300">Vehicle #TX-2938 Overheating</p>
                <p className="text-xs text-muted-foreground">Engine coolant levels critical. Route redirect issued.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/25">
              <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Driver License Expiring</p>
                <p className="text-xs text-muted-foreground">John Doe (License #DL-9827) expires in 4 days.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
