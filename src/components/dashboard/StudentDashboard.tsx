import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UtensilsCrossed,
  ClipboardCheck,
  MessageSquare,
  Ticket,
  ChevronRight,
  Coffee,
  Sun,
  Moon,
  Check,
  X,
  Home,
  Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TodayMenu {
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
}

interface AttendanceSummary {
  present: number;
  absent: number;
  percentage: number;
  todayStatus: boolean | null;
}

export function StudentDashboard() {
  const { profile } = useAuth();
  const [todayMenu, setTodayMenu] = useState<TodayMenu | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary>({
    present: 0,
    absent: 0,
    percentage: 0,
    todayStatus: null,
  });
  const [pendingPasses, setPendingPasses] = useState(0);
  const [activeComplaints, setActiveComplaints] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchDashboardData = async () => {
      // Fetch today's menu
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: menuData } = await supabase
        .from("food_menu")
        .select("breakfast, lunch, dinner")
        .eq("menu_date", today)
        .maybeSingle();
      setTodayMenu(menuData);

      // Fetch attendance summary
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", profile.id);

      if (attendanceData) {
        const present = attendanceData.filter((a) => a.is_present).length;
        const total = attendanceData.length;
        const todayAttendance = attendanceData.find((a) =>
          isToday(new Date(a.attendance_date))
        );

        setAttendance({
          present,
          absent: total - present,
          percentage: total > 0 ? Math.round((present / total) * 100) : 0,
          todayStatus: todayAttendance?.is_present ?? null,
        });
      }

      // Fetch pending passes count
      const { count: passCount } = await supabase
        .from("passes")
        .select("*", { count: "exact", head: true })
        .eq("student_id", profile.id)
        .eq("status", "pending");
      setPendingPasses(passCount || 0);

      // Fetch active complaints count
      const { count: complaintCount } = await supabase
        .from("complaints")
        .select("*", { count: "exact", head: true })
        .eq("student_id", profile.id)
        .in("status", ["pending", "in_progress"]);
      setActiveComplaints(complaintCount || 0);
    };

    fetchDashboardData();
  }, [profile?.id]);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
        <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.full_name?.split(" ")[0]}!</h1>
            <p className="mt-2 text-primary-foreground/80 text-lg font-medium">
              {profile?.hostel_name || "Your hostel"} • Room {profile?.room_number || "N/A"}
            </p>
        </div>
      </motion.div>

      {/* Room & Hostel Info */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        <Card className="card-shadow border-l-4 border-l-primary overflow-hidden">
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Home className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 font-medium">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Room Number</p>
              <p className="text-lg sm:text-xl font-bold truncate">{profile?.room_number || "Not Assigned"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-l-4 border-l-blue-500 overflow-hidden">
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 font-medium">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Hostel / Block</p>
              <p className="text-lg sm:text-xl font-bold truncate">{profile?.hostel_name || "Not Assigned"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: "Attendance", value: `${attendance.percentage}%`, icon: ClipboardCheck, color: "primary" },
          { label: "Pending Passes", value: pendingPasses, icon: Ticket, color: "amber-500" },
          { label: "Complaints", value: activeComplaints, icon: MessageSquare, color: "blue-500" },
          { 
            label: "Today", 
            value: attendance.todayStatus === true ? "Present" : attendance.todayStatus === false ? "Absent" : "N/A", 
            icon: attendance.todayStatus === true ? Check : attendance.todayStatus === false ? X : ClipboardCheck, 
            color: attendance.todayStatus === true ? "green-500" : attendance.todayStatus === false ? "red-500" : "muted" 
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
            whileHover={{ y: -5 }}
            className="transition-all duration-300"
          >
            <Card className="glass-card h-full">
              <CardContent className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 text-center sm:text-left">
                <div className={cn(
                    "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl shrink-0 transition-transform duration-300",
                    stat.color === "primary" ? "bg-primary/10 text-primary" : 
                    stat.color === "muted" ? "bg-muted text-muted-foreground" :
                    `bg-${stat.color.split('-')[0]}-500/10 text-${stat.color}`
                )}>
                  <stat.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold mt-0.5 truncate">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Today's Menu */}
      <Card className="card-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Today's Menu
          </CardTitle>
          <Link to="/menu">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {todayMenu ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-lg bg-accent/50 p-4">
                <Coffee className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Breakfast</p>
                  <p className="mt-1 text-sm">{todayMenu.breakfast || "Not updated"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-accent/50 p-4">
                <Sun className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lunch</p>
                  <p className="mt-1 text-sm">{todayMenu.lunch || "Not updated"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-accent/50 p-4">
                <Moon className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dinner</p>
                  <p className="mt-1 text-sm">{todayMenu.dinner || "Not updated"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/50 p-6 text-center">
              <UtensilsCrossed className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Menu not updated yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/passes" className="hover-scale">
          <Card className="card-shadow cursor-pointer border-2 border-transparent transition-colors hover:border-primary/20">
            <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Ticket className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-semibold">Request Pass</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Outing or Home Vacation</p>
              </div>
              <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/complaints" className="hover-scale">
          <Card className="card-shadow cursor-pointer border-2 border-transparent transition-colors hover:border-primary/20">
            <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-semibold">File Complaint</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Report an issue</p>
              </div>
              <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/attendance" className="hover-scale">
          <Card className="card-shadow cursor-pointer border-2 border-transparent transition-colors hover:border-primary/20">
            <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-semibold">View Attendance</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Check your history</p>
              </div>
              <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
