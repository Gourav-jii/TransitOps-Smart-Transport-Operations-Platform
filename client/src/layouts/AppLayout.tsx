import { useState, useEffect, useRef } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTheme } from "@/context/ThemeContext"
import { useAuth, type UserRole } from "@/context/AuthContext"
import notificationService from "@/services/notificationService"
import searchService from "@/services/searchService"
import { toast } from "sonner"
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
  Check,
  Trash2,
  X,
  AlertTriangle,
  Search,
  History,
  CornerDownLeft,
  Activity
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
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Layout collapsed / mobile states
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  // Global Search states
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)

  // Debounce search input changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem("transitops_search_history")
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  // Keyboard shortcut listener (Cmd+K / Ctrl+K to open search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsSearchOpen(true)
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Sidebar navigation configuration with role boundaries
  const navItems: NavItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutGrid },
    { name: "Vehicles", path: "/vehicles", icon: Truck, roles: ["Fleet Manager", "Dispatcher"] },
    { name: "Drivers", path: "/drivers", icon: Users, roles: ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"] },
    { name: "Trips", path: "/trips", icon: Route, roles: ["Fleet Manager", "Dispatcher"] },
    { name: "Maintenance", path: "/maintenance", icon: Wrench, roles: ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"] },
    { name: "Fuel Logs", path: "/fuel-logs", icon: Fuel, roles: ["Fleet Manager", "Financial Analyst"] },
    { name: "Expenses", path: "/expenses", icon: DollarSign, roles: ["Fleet Manager", "Financial Analyst"] },
    { name: "Audit Logs", path: "/audit-logs", icon: Activity, roles: ["Fleet Manager", "Safety Officer"] },
    { name: "Documents", path: "/documents", icon: FileText, roles: ["Fleet Manager", "Safety Officer"] },
    { name: "Reports", path: "/reports", icon: FileText, roles: ["Fleet Manager", "Safety Officer", "Financial Analyst", "Dispatcher"] },
    { name: "Settings", path: "/settings", icon: Settings, roles: ["Fleet Manager"] },
  ]

  // React Query: Fetch notifications with polling
  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(),
    enabled: !!user,
    refetchInterval: 15000, // Poll every 15 seconds
  })

  // React Query: Global Search
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["globalSearch", debouncedQuery],
    queryFn: () => searchService.search(debouncedQuery).then(res => res.data.data),
    enabled: debouncedQuery.trim().length > 1,
  })

  // Notifications Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("All notifications marked as read")
    },
  })

  const deleteNotifMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("Notification deleted")
    },
  })

  const scanMutation = useMutation({
    mutationFn: () => notificationService.triggerComplianceScan(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("Compliance scan complete", {
        description: res.message || `${res.data?.newCount || 0} alerts discovered.`,
      })
    },
    onError: (err: any) => {
      toast.error("Scan failed", {
        description: err.message || "Failed to trigger automated operations audit.",
      })
    },
  })

  const notifications = notifData?.data || []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Filter nav items by user role
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  )

  const handleLogout = () => {
    logout()
  }

  // Save term to search history
  const saveSearchTerm = (term: string) => {
    const cleanTerm = term.trim()
    if (!cleanTerm) return
    const updated = [cleanTerm, ...searchHistory.filter(h => h !== cleanTerm)].slice(0, 5)
    setSearchHistory(updated)
    localStorage.setItem("transitops_search_history", JSON.stringify(updated))
  }

  const handleSearchSelect = (item: any) => {
    saveSearchTerm(searchQuery || item.title)
    setIsSearchOpen(false)
    setSearchQuery("")
    setDebouncedQuery("")
    navigate(item.link)
  }

  // Keyboard navigation for search results
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    const list = searchResults || []
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % Math.max(list.length, 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + list.length) % Math.max(list.length, 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (list[selectedIndex]) {
        handleSearchSelect(list[selectedIndex])
      }
    }
  }

  const getNotifCategoryInfo = (type: string) => {
    switch (type) {
      case "Maintenance Started":
      case "Maintenance Completed":
      case "Maintenance Overdue":
        return { category: "Maintenance", color: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/5", icon: Wrench }
      case "Insurance Expiring":
      case "Fitness Expiring":
      case "Pollution Certificate Expiring":
        return { category: "Safety", color: "text-red-500 bg-red-500/10 dark:bg-red-500/5", icon: AlertTriangle }
      case "Trip":
        return { category: "Trip", color: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/5", icon: Route }
      case "Finance":
        return { category: "Finance", color: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/5", icon: DollarSign }
      default:
        return { category: "System", color: "text-slate-500 bg-slate-500/10 dark:bg-slate-500/5", icon: Bell }
    }
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      
      {/* --- SIDEBAR FOR DESKTOP --- */}
      <aside
        className={`hidden md:flex flex-col bg-card border-r border-border/60 transition-all duration-300 relative ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-border/40 gap-3 overflow-hidden">
          <div className="p-2 bg-primary text-primary-foreground rounded-lg flex-shrink-0">
            <Truck className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              TransitOps
            </span>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-20 -right-3 h-6 w-6 bg-card border border-border/85 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm hover:shadow z-10"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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

        <div className="p-4 border-t border-border/40 space-y-2">
          <Link
            to="/profile"
            className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
              location.pathname === "/profile" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
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

      {/* --- SIDEBAR FOR MOBILE --- */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
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
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
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
              <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <UserIcon className="h-4 w-4" />
              </div>
            )}
            <div className="text-left">
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
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Navbar Global Search Input */}
            <div className="hidden sm:block relative">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-60 md:w-80 flex items-center justify-between bg-secondary/80 border border-border/60 hover:border-border rounded-xl px-3 py-1.5 text-xs text-muted-foreground font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Search across platform...</span>
                </div>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/80 bg-background px-1.5 font-mono text-[9px] font-bold text-muted-foreground">
                  <span>⌘</span>K
                </kbd>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Search Button for Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Notification Bell with Badge */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative text-muted-foreground hover:text-foreground animate-none"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-destructive text-[8px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>

            <div className="h-8 w-px bg-border/60 mx-1" />

            {/* Profile Link */}
            <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity pl-1">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-8.5 w-8.5 rounded-full object-cover ring-2 ring-primary/20" />
              ) : (
                <div className="h-8.5 w-8.5 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <UserIcon className="h-4.5 w-4.5" />
                </div>
              )}
              <div className="hidden lg:flex flex-col text-left font-sans">
                <span className="text-xs font-semibold leading-tight text-foreground/90">{user?.name}</span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary w-fit mt-0.5">
                  {user?.role}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* --- GLOBAL SEARCH MODAL OVERLAY --- */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-[10vh] animate-in fade-in duration-150">
            {/* Backdrop click to close */}
            <div className="fixed inset-0" onClick={() => setIsSearchOpen(false)} />
            
            <div className="relative bg-card border border-border shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[70vh] scale-100 transition-all duration-200">
              
              {/* Search Header */}
              <div className="p-4 border-b border-border/40 flex items-center gap-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type to search vehicles, drivers, trips, maintenance logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full bg-transparent border-none text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0 font-medium"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 rounded-full hover:bg-muted text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 border border-border rounded text-[9px] font-mono text-muted-foreground font-bold">
                  ESC
                </kbd>
              </div>

              {/* Search Body scrollarea */}
              <div ref={resultsContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* 1. Show History when query is empty */}
                {!searchQuery && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5" /> Recent Search Queries
                    </h3>
                    {searchHistory.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 py-2">No recent search history stored.</p>
                    ) : (
                      <div className="flex flex-col">
                        {searchHistory.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => setSearchQuery(h)}
                            className="flex items-center gap-3 px-2 py-2 rounded-lg text-left text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                          >
                            <History className="h-3.5 w-3.5 text-muted-foreground/45" />
                            <span>{h}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Loading State */}
                {searchQuery && isSearching && (
                  <div className="py-8 text-center text-xs text-muted-foreground">Indexing databases matching: `{searchQuery}`...</div>
                )}

                {/* 3. Results Output */}
                {searchQuery && !isSearching && searchResults && (
                  <div className="space-y-3">
                    {searchResults.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No matches found matching query string: `{searchQuery}`.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 select-none">
                        {searchResults.map((item: any, idx: number) => {
                          const isSelected = selectedIndex === idx
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSearchSelect(item)}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                                isSelected ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" : "hover:bg-secondary"
                              }`}
                            >
                              <div className="text-left">
                                <p className={`text-xs font-bold ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                                  {item.title}
                                </p>
                                <p className={`text-[10px] mt-0.5 ${isSelected ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                                  {item.subtitle}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}>
                                  {item.category}
                                </span>
                                {isSelected && <CornerDownLeft className="h-3.5 w-3.5 animate-pulse" />}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- NOTIFICATION CENTER DRAWER --- */}
        {isNotifOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="fixed inset-0" onClick={() => setIsNotifOpen(false)} />
            
            <div className="relative w-full max-w-md bg-card border-l border-border h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              
              {/* Header */}
              <div className="p-4 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Notification Drawer</h3>
                </div>
                <div className="flex items-center gap-2.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        markAllReadMutation.mutate()
                        setIsNotifOpen(false)
                      }}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      Read All
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="p-1 rounded-full border border-border hover:bg-muted text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/30">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground space-y-2">
                    <Bell className="h-10 w-10 mx-auto text-muted-foreground/30" />
                    <h4 className="font-bold text-sm text-foreground/80">Inbox is Clear</h4>
                    <p className="text-xs">No notifications logged.</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const info = getNotifCategoryInfo(n.type)
                    const Icon = info.icon
                    return (
                      <div
                        key={n._id}
                        className={`p-4 flex gap-3 transition-colors text-left relative ${
                          n.isRead ? "opacity-75" : "bg-primary/5 border-l-2 border-primary"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${info.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-xs leading-snug">{n.title}</span>
                            <span className="text-[9px] text-muted-foreground/70 font-medium">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-normal">{n.message}</p>
                          
                          <div className="pt-2.5 flex items-center gap-3">
                            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                              {info.category}
                            </span>
                            {!n.isRead && (
                              <button
                                onClick={() => markReadMutation.mutate(n._id)}
                                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                              >
                                <Check className="h-3 w-3" /> Mark as Read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotifMutation.mutate(n._id)}
                              className="text-[10px] font-bold text-destructive hover:underline ml-auto flex items-center gap-0.5"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* manual scan button for manager/safety officer */}
              {(user?.role === "Fleet Manager" || user?.role === "Safety Officer") && (
                <div className="p-4 border-t border-border/40 bg-muted/10">
                  <Button
                    variant="outline"
                    className="w-full text-xs font-bold"
                    onClick={() => scanMutation.mutate()}
                    disabled={scanMutation.isPending}
                  >
                    {scanMutation.isPending ? "Auditing records..." : "Trigger Compliance Scan"}
                  </Button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* CONTENT AREA */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
