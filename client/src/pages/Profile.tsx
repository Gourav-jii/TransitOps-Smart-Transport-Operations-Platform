import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import api from "@/services/api"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { toast } from "sonner"
import {
  User as UserIcon,
  Shield,
  Key,
  Calendar,
  Clock,
  Activity,
  Upload
} from "lucide-react"

export default function Profile() {
  const { user, updateUser } = useAuth()
  
  // Profile settings state
  const [name, setName] = useState(user?.name || "")
  const [avatar, setAvatar] = useState(user?.avatar || "")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password reset state
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Avatar presets
  const avatarPresets = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
  ]

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name cannot be empty")
      return
    }

    setIsUpdatingProfile(true)
    try {
      const res = await api.put("/auth/update-profile", { name, avatar })
      if (res.data?.success && res.data?.user) {
        updateUser(res.data.user)
        toast.success("Profile updated successfully")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long")
      return
    }

    setIsUpdatingPassword(true)
    try {
      const res = await api.put("/auth/change-password", { oldPassword, newPassword })
      if (res.data?.success) {
        toast.success("Password updated successfully")
        setOldPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Incorrect current password")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar size exceeds 2MB limit")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">User Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal details, credentials, and track your workspace login sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PROFILE GENERAL DETAILS CARD */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/60 bg-card/60 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/15">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" /> General Profile Settings
              </CardTitle>
              <CardDescription>Update your display name and upload a profile picture.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                
                {/* Avatar upload */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    {avatar ? (
                      <img src={avatar} alt={user?.name} className="h-20 w-20 rounded-full object-cover ring-4 ring-primary/20" />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <UserIcon className="h-10 w-10" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-3 w-full text-left">
                    <span className="text-xs font-bold text-muted-foreground block">Choose Avatar Photo</span>
                    
                    {/* Preset Picker */}
                    <div className="flex gap-2">
                      {avatarPresets.map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAvatar(p)}
                          className={`h-9 w-9 rounded-full overflow-hidden border-2 transition-all ${
                            avatar === p ? "border-primary scale-110 shadow-sm" : "border-transparent opacity-75 hover:opacity-100"
                          }`}
                        >
                          <img src={p} className="h-full w-full object-cover" />
                        </button>
                      ))}
                      
                      {/* Upload button wrapper */}
                      <label className="h-9 w-9 rounded-full border border-dashed border-border/80 flex items-center justify-center cursor-pointer hover:border-primary/50 text-muted-foreground transition-colors bg-background">
                        <Upload className="h-4 w-4" />
                        <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background border border-border/80 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold"
                  />
                </div>

                {/* Email (Read-Only) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Email Address (Read-only)</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="bg-muted border border-border/80 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground cursor-not-allowed"
                  />
                </div>

                <Button type="submit" disabled={isUpdatingProfile} className="w-full sm:w-auto font-semibold">
                  {isUpdatingProfile ? "Saving updates..." : "Save Profile Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* PASSWORD SECURITY CARD */}
          <Card className="border-border/60 bg-card/60 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/15">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" /> Update Password
              </CardTitle>
              <CardDescription>Ensure your account stays protected by using a strong password.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="bg-background border border-border/80 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-muted-foreground">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-background border border-border/80 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-background border border-border/80 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isUpdatingPassword} className="w-full sm:w-auto font-semibold">
                  {isUpdatingPassword ? "Updating password..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* PROFILE META STATS PANEL */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-card shadow-sm">
            <CardContent className="p-5 space-y-6">
              
              <div className="text-center space-y-3">
                {avatar ? (
                  <img src={avatar} className="h-16 w-16 mx-auto rounded-full object-cover border-2 border-primary/20" />
                ) : (
                  <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <UserIcon className="h-8 w-8" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm text-foreground/90">{user?.name}</h3>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary mt-1">
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Access scope details */}
              <div className="border-t border-border/40 pt-4 space-y-3">
                <h4 className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-primary" /> Workspace Security Level
                </h4>
                <div className="bg-secondary/40 border border-border/40 rounded-xl p-3 text-xs leading-normal font-medium text-foreground/80">
                  {user?.role === "Fleet Manager" && "Complete read, write, audit, and configuration access across platform modules."}
                  {user?.role === "Dispatcher" && "Management access limited to vehicle tracking, driver dispatches, and active trip scheduling."}
                  {user?.role === "Safety Officer" && "Audit access focusing on maintenance logs, document compliance, and driver safety reports."}
                  {user?.role === "Financial Analyst" && "Analytical review access centered on fuel logs, cost distributions, and profitability margins."}
                </div>
              </div>

              {/* Sessions statistics */}
              <div className="border-t border-border/40 pt-4 space-y-3">
                <h4 className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-primary" /> System Session Trace
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                      <Calendar className="h-3.5 w-3.5" /> Joining Date
                    </span>
                    <span className="font-semibold text-foreground/80">Jul 12, 2026</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                      <Clock className="h-3.5 w-3.5" /> Last Login Session
                    </span>
                    <span className="font-semibold text-foreground/80 truncate max-w-[120px]" title={user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Now"}>
                      {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Just now"}
                    </span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  )
}
