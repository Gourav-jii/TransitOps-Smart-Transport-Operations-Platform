import { Button } from "@/components/ui/Button"
import { ShieldX } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
      <div className="p-4 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 shadow-lg shadow-destructive/5 animate-bounce">
        <ShieldX className="h-16 w-16" />
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-extrabold tracking-tight">Access Forbidden</h1>
        <p className="text-muted-foreground">
          You do not have the required security credentials to access this operation portal. Contact your network administrator.
        </p>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button onClick={() => navigate("/dashboard")}>
          Return Dashboard
        </Button>
      </div>
    </div>
  )
}
