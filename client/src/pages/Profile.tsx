import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { User, Mail, Shield } from "lucide-react"

export default function Profile() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">User Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your administrator details, security credentials, and session audits.</p>
      </div>

      <div className="max-w-2xl">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-xl">TransitOps Admin</CardTitle>
              <CardDescription>System Administrator & Logistics Officer</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/40 rounded-lg flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email Address</p>
                  <p className="text-sm font-semibold">admin@transitops.com</p>
                </div>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Access Role</p>
                  <p className="text-sm font-semibold text-primary">Super-Admin</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline">Reset Password</Button>
              <Button>Edit Details</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
