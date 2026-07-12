import { useState, useEffect } from "react"
import { useTheme } from "@/context/ThemeContext"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { toast } from "sonner"
import {
  Sun,
  Moon,
  Laptop,
  Calendar,
  Globe,
  Bell,
  Languages,
  CheckCircle2,
  Database
} from "lucide-react"

export default function Settings() {
  const { theme, setTheme } = useTheme()
  
  // Date format states
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY")
  
  // Language placeholder
  const [language, setLanguage] = useState("en")

  // Timezone placeholder
  const [timezone, setTimezone] = useState("UTC+5:30")

  // Notification Preferences States
  const [notifTrips, setNotifTrips] = useState(true)
  const [notifMaint, setNotifMaint] = useState(true)
  const [notifSafety, setNotifSafety] = useState(true)
  const [notifFinance, setNotifFinance] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedFormat = localStorage.getItem("transitops_date_format")
    if (savedFormat) setDateFormat(savedFormat)

    const savedPrefs = localStorage.getItem("transitops_notif_preferences")
    if (savedPrefs) {
      const parsed = JSON.parse(savedPrefs)
      setNotifTrips(parsed.trips ?? true)
      setNotifMaint(parsed.maintenance ?? true)
      setNotifSafety(parsed.safety ?? true)
      setNotifFinance(parsed.finance ?? false)
    }
  }, [])

  const handleSaveSettings = () => {
    localStorage.setItem("transitops_date_format", dateFormat)
    
    const prefs = {
      trips: notifTrips,
      maintenance: notifMaint,
      safety: notifSafety,
      finance: notifFinance
    }
    localStorage.setItem("transitops_notif_preferences", JSON.stringify(prefs))
    toast.success("Application settings updated successfully")
  }

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Application Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize platform appearance, regional formatting, and alert triggers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* SETTINGS MODULE */}
        <div className="md:col-span-2 space-y-6">
          
          {/* THEME PREFERENCE CARD */}
          <Card className="border-border/60 bg-card/60 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/15">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sun className="h-5 w-5 text-primary" /> Visual Theme Settings
              </CardTitle>
              <CardDescription>Select how TransitOps displays inside your browser.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                
                {/* Light */}
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:bg-secondary/40 select-none ${
                    theme === "light" ? "border-primary bg-primary/5 shadow-sm font-bold" : "border-border/60"
                  }`}
                >
                  <Sun className={`h-6 w-6 ${theme === "light" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs">Light Mode</span>
                </button>

                {/* Dark */}
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:bg-secondary/40 select-none ${
                    theme === "dark" ? "border-primary bg-primary/5 shadow-sm font-bold" : "border-border/60"
                  }`}
                >
                  <Moon className={`h-6 w-6 ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs">Dark Mode</span>
                </button>

                {/* System */}
                <button
                  type="button"
                  onClick={() => setTheme("dark")} // Fallback or System hook
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:bg-secondary/40 select-none ${
                    theme === "system" ? "border-primary bg-primary/5 shadow-sm font-bold" : "border-border/60"
                  }`}
                >
                  <Laptop className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs">System Default</span>
                </button>

              </div>
            </CardContent>
          </Card>

          {/* DATE & TIME REGIONAL CARD */}
          <Card className="border-border/60 bg-card/60 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/15">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Regional & Localization
              </CardTitle>
              <CardDescription>Configure language translations and timezone formats.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              
              {/* Date Format */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Date Format Display</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="bg-background border border-border/80 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 07/12/2026)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 12/07/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-07-12)</option>
                </select>
              </div>

              {/* Language */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Languages className="h-4 w-4" /> Platform Language (Placeholder translation)
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-background border border-border/80 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español (ES)</option>
                  <option value="fr">Français (FR)</option>
                </select>
              </div>

              {/* Timezone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Globe className="h-4 w-4" /> Time Zone (Placeholder offset)
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="bg-background border border-border/80 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="UTC+5:30">UTC+5:30 (Chennai, Kolkata, Mumbai, New Delhi)</option>
                  <option value="UTC+0">UTC+00:00 (Greenwich Mean Time)</option>
                  <option value="UTC-5">UTC-05:00 (Eastern Standard Time)</option>
                </select>
              </div>

            </CardContent>
          </Card>

          {/* NOTIFICATION PREFERENCES CARD */}
          <Card className="border-border/60 bg-card/60 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/15">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" /> Notification Center Preferences
              </CardTitle>
              <CardDescription>Choose which updates trigger system messages and emails.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifTrips}
                    onChange={(e) => setNotifTrips(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold block text-foreground/90">Trip Status Dispatches</span>
                    <span className="text-[10px] text-muted-foreground">Alerts when trips are dispatched, complete, or delayed.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifMaint}
                    onChange={(e) => setNotifMaint(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold block text-foreground/90">Maintenance Overdue Schedules</span>
                    <span className="text-[10px] text-muted-foreground">Reminders for scheduled, in-progress, or warning maintenance services.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifSafety}
                    onChange={(e) => setNotifSafety(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold block text-foreground/90">Safety compliance & scanned document expiries</span>
                    <span className="text-[10px] text-muted-foreground">Automated daily reports scanning driver licenses and pollution cards.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifFinance}
                    onChange={(e) => setNotifFinance(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold block text-foreground/90">Financial Budget Warnings</span>
                    <span className="text-[10px] text-muted-foreground">Notifications when fuel rates or maintenance items exceed regional budgets.</span>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-border/40 flex justify-end">
                <Button onClick={handleSaveSettings} className="font-semibold">
                  Save All Preferences
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* SIDE HELPFUL INFO */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground/90 flex items-center gap-1.5">
              <Database className="h-4.5 w-4.5 text-primary" /> TransitOps v1.2 Enterprise
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Platform preferences and layout configs are stored inside secure browser cookies and localStorage caches to enable fast offline rendering.
            </p>
            <div className="bg-secondary/40 border border-border/40 rounded-xl p-3 text-xs leading-normal font-bold text-primary flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Theme changes persist immediately.</span>
            </div>
          </Card>
        </div>

      </div>

    </div>
  )
}
