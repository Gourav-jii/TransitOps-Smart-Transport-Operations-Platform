import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { FileText, Download } from "lucide-react"

export default function Reports() {
  const reportsList = [
    { title: "Fleet Utilization Report", description: "Details overall trip logs, driver hours, and vehicle idle rates.", date: "June 2026" },
    { title: "Monthly Fuel Efficiency Audit", description: "Consumption data by vehicle model, mileage audits, and fuel waste metrics.", date: "June 2026" },
    { title: "Maintenance Cost Projection", description: "Upcoming service estimates, parts costs, and mechanics log review.", date: "Q2 2026" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Reports</h1>
        <p className="text-muted-foreground mt-1">Export analytics, download fleet utilization data, and request carbon offset summaries.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {reportsList.map((rep) => (
          <Card key={rep.title} className="border-border/60 flex flex-col justify-between">
            <CardHeader>
              <div className="p-2 w-fit rounded-lg bg-primary/10 text-primary mb-3">
                <FileText className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{rep.title}</CardTitle>
              <CardDescription className="pt-2">{rep.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex items-center justify-between mt-auto">
              <span className="text-xs text-muted-foreground">Generated: {rep.date}</span>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
