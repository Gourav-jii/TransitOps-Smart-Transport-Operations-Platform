import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Plus, DollarSign } from "lucide-react"

export default function Expenses() {
  const dummyExpenses = [
    { id: "EXP-901", category: "Tolls & Permits", amount: "$85.00", date: "2026-07-11", status: "Approved" },
    { id: "EXP-902", category: "Insurance Prem.", amount: "$1,200.00", date: "2026-07-10", status: "Pending" },
    { id: "EXP-903", category: "Driver Lodging", amount: "$150.00", date: "2026-07-09", status: "Approved" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Expenses</h1>
          <p className="text-muted-foreground mt-1">Audit operational expenses, driver disbursements, toll reports, and billing.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Log Expense
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Expense Audit Ledger</CardTitle>
          <CardDescription>Consolidated registry of fleet spending logs.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 rounded-l-lg">ID</th>
                <th className="p-4">Expense Category</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Log Date</th>
                <th className="p-4 border-border">Status</th>
                <th className="p-4 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {dummyExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-semibold text-primary">{exp.id}</td>
                  <td className="p-4 flex items-center gap-1 font-medium">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    {exp.category}
                  </td>
                  <td className="p-4 font-bold">{exp.amount}</td>
                  <td className="p-4 text-muted-foreground text-xs">{exp.date}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      exp.status === "Approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
                      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                    }`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm">Approve</Button>
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
