import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useBackButtonGuard } from "@/hooks/useBackButtonGuard";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  UtensilsCrossed,
  ClipboardCheck,
  MessageSquare,
  Ticket,
  Bell,
  LogOut,
  Menu,
  X,
  Users,
  Megaphone,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { VoiceNavigation } from "./VoiceNavigation";
import { ThemeToggle } from "./ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  label: string;
  /** Path for students (flat) */
  studentPath: string;
  /** Path for admins (/admin/* prefixed) */
  adminPath: string;
  icon: React.ElementType;
  roles: ("student" | "admin")[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", studentPath: "/dashboard", adminPath: "/admin/dashboard", icon: Home, roles: ["student", "admin"] },
  { label: "My Profile", studentPath: "/profile", adminPath: "/profile", icon: User, roles: ["student"] },
  { label: "Food Menu", studentPath: "/menu", adminPath: "/admin/menu", icon: UtensilsCrossed, roles: ["student", "admin"] },
  { label: "Attendance", studentPath: "/attendance", adminPath: "/admin/attendance", icon: ClipboardCheck, roles: ["student", "admin"] },
  { label: "Complaints", studentPath: "/complaints", adminPath: "/admin/complaints", icon: MessageSquare, roles: ["student", "admin"] },
  { label: "Passes", studentPath: "/passes", adminPath: "/admin/passes", icon: Ticket, roles: ["student", "admin"] },
  { label: "Notices", studentPath: "/notices", adminPath: "/admin/notices", icon: Megaphone, roles: ["student", "admin"] },
  { label: "Students", studentPath: "/students", adminPath: "/admin/students", icon: Users, roles: ["admin"] },
];

export function AppLayout() {
  const { profile, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Trap browser back button — prevents navigating out of dashboard
  useBackButtonGuard();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(profile?.role as "student" | "admin")
  );

  // Resolve the correct path based on user role
  const getPath = (item: NavItem) => (isAdmin ? item.adminPath : item.studentPath);

  return (
    <div className="min-h-screen bg-background/50 selection:bg-primary/10">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-primary">Hostel Hub</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationDropdown />
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full transform border-r transition-all duration-300 ease-in-out md:translate-x-0 glass-morphism",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
              <Home className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent transform transition-all duration-300">
                Hostel Hub
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-col gap-1.5 p-4">
          {filteredNavItems.map((item) => {
            const itemPath = getPath(item);
            const isActive = location.pathname === itemPath;
            return (
              <Link
                key={itemPath}
                to={itemPath}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                {isActive && (
                    <div className="absolute left-0 h-5 w-1 rounded-r-full bg-primary" />
                )}
                <item.icon className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {!isCollapsed && (
                  <span className="truncate transition-all duration-300">{item.label}</span>
                )}
                {isCollapsed && isActive && (
                   <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-4 flex flex-col gap-4">
          {!isCollapsed && (
            <div className="rounded-2xl bg-secondary/50 border border-border/50 p-4 transition-all duration-300">
              <p className="text-sm font-semibold truncate">
                {profile?.full_name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAdmin ? "Administrator" : `Room ${profile?.room_number || "N/A"}`}
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 rounded-xl px-3 py-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all",
                isCollapsed && "px-0 justify-center"
              )}
              onClick={signOut}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="hidden md:flex ml-auto h-8 w-8 rounded-full border border-border shadow-sm hover:scale-110 transition-transform"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
          "transition-all duration-300 min-h-screen",
          isCollapsed ? "md:pl-20" : "md:pl-64"
      )}>
        {/* Desktop header */}
        <header className="sticky top-0 z-40 hidden h-20 items-center justify-between border-b bg-background/50 backdrop-blur-md px-8 md:flex transition-all duration-300">
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              {filteredNavItems.find((item) => getPath(item) === location.pathname)?.label || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <NotificationDropdown />
            </div>
            <div className="h-8 w-[1px] bg-border/60" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-sm font-bold">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground font-medium">
                  {isAdmin ? "Administrator" : profile?.hostel_name || "Student"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                {profile?.full_name?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <VoiceNavigation />
    </div>
  );
}
