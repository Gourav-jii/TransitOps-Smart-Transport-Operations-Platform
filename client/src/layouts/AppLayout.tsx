import { useState } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { useTheme } from "@/context/ThemeContext"
import { useAuth, type UserRole } from "@/context/AuthContext"
import { Button } from "@/components/ui/Button"
import {
  LayoutGrid,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  DollarSign,
  FileText,
  Settings,
  User as UserIcon,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Bell,
} from "lucide-react"

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}

export default function AppLayout() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Sidebar navigation configuration with role boundaries
  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutGrid,
    },
    {
      name: "Vehicles",
      path: "/vehicles",
      icon: Truck,
      roles: ["Fleet Manager", "Dispatcher"],
    },
    {
      name: "Drivers",
      path: "/drivers",
      icon: Users,
      roles: ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"],
    },
    {
      name: "Trips",
      path: "/trips",
      icon: Route,
      roles: ["Fleet Manager", "Dispatcher"],
    },
    {
      name: "Maintenance",
      path: "/maintenance",
      icon: Wrench,
      roles: ["Fleet Manager"],
    },
    {
      name: "Fuel Logs",
      path: "/fuel-logs",
      icon: Fuel,
      roles: ["Fleet Manager", "Financial Analyst"],
    },
    {
      name: "Expenses",
      path: "/expenses",
      icon: DollarSign,
      roles: ["Fleet Manager", "Financial Analyst"],
    },
    {
      name: "Reports",
      path: "/reports",
      icon: FileText,
      roles: ["Fleet Manager", "Safety Officer", "Financial Analyst"],
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      roles: ["Fleet Manager"],
    },
  ]

  // Filter items matching current user's role
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  )

  const handleLogout = () => {
    logout()
  }

  // Find active nav item to display title in Navbar
  const currentNavItem = navItems.find((item) => item.path === location.pathname)
  const pageTitle = currentNavItem ? currentNavItem.name : "TransitOps"

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      
      {/* --- SIDEBAR FOR DESKTOP --- */}
      <aside
        className={`hidden md:flex flex-col bg-card border-r border-border/60 transition-all duration-300 relative ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Header logo area */}
        <div className="h-16 flex items-center px-6 border-b border-border/40 gap-3 overflow-hidden">
          <div className="p-2 bg-primary text-primary-foreground rounded-lg flex-shrink-0">
            <Truck className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent transition-opacity duration-200">
              TransitOps
            </span>
          )}
        </div>

        {/* Collapsible toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-20 -right-3 h-6 w-6 bg-card border border-border/80 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm hover:shadow transition-all z-10"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-border/40 space-y-2">
          <Link
            to="/profile"
            className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
              location.pathname === "/profile"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <UserIcon className="h-4 w-4" />
              </div>
            )}
            {!isCollapsed && (
              <div className="truncate text-left flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-foreground">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{user?.role}</p>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive px-3 ${
              isCollapsed ? "h-10 w-10 p-0 justify-center" : ""
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* --- SIDEBAR FOR MOBILE (SLIDE-OUT) --- */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 md:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg">
              <Truck className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              TransitOps
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-border/40 space-y-2">
          <Link
            to="/profile"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <UserIcon className="h-4 w-4" />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-foreground leading-tight">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{user?.role}</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* STICKY NAVBAR */}
        <header className="sticky top-0 z-30 h-16 bg-card/85 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-bold tracking-tight text-foreground/80 md:text-xl">
              {pageTitle}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Notification placeholder */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-destructive rounded-full" />
            </Button>

            <div className="h-8 w-px bg-border/60 mx-1" />

            {/* Profile Avatar link & Role Badge */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 hover:opacity-85 transition-opacity pl-1"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-8.5 w-8.5 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="h-8.5 w-8.5 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <UserIcon className="h-4.5 w-4.5" />
                </div>
              )}
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold leading-tight text-foreground/90">{user?.name}</span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary w-fit mt-0.5">
                  {user?.role}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
