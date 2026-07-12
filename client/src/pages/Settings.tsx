import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global operational parameters, notification routes, and API settings.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Fleet Management Limits</CardTitle>
            <CardDescription>Configure boundaries for fuel logs, speeds, and notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Speed Warning Threshold (MPH)</label>
              <input type="number" defaultValue={75} className="w-full bg-background border border-border rounded-lg p-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Idle Alert Trigger (Minutes)</label>
              <input type="number" defaultValue={15} className="w-full bg-background border border-border rounded-lg p-2 text-sm" />
            </div>
            <Button>Save Parameters</Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>System Integrations</CardTitle>
            <CardDescription>Third-party logistics API credentials and sync status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
              <div>
                <p className="text-sm font-semibold">GPS Telematics Core</p>
                <p className="text-xs text-muted-foreground">Connected to FleetGPS Global v4</p>
              </div>
              <span className="text-xs font-bold text-emerald-600">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
              <div>
                <p className="text-sm font-semibold">ELD Logging Sync</p>
                <p className="text-xs text-muted-foreground">Electronic Logging Device Sync</p>
              </div>
              <span className="text-xs font-bold text-muted-foreground">Not Configured</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
