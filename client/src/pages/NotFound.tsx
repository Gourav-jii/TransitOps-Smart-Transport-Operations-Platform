import { Button } from "@/components/ui/Button"
import { Compass } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
      <div className="p-4 bg-primary/10 text-primary rounded-2xl border border-primary/20 shadow-lg shadow-primary/5 animate-pulse">
        <Compass className="h-16 w-16" />
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-5xl font-extrabold tracking-tight">404</h1>
        <h2 className="text-xl font-semibold">Route Dispatched Out of Bounds</h2>
        <p className="text-muted-foreground">
          The operation portal path you are seeking does not exist or has been redirected to another route.
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
