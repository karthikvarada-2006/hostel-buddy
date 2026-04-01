import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Ticket,
  MessageSquare,
  ClipboardCheck,
  ChevronRight,
  AlertCircle,
  Clock,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface DashboardStats {
  totalStudents: number;
  pendingPasses: number;
  activeComplaints: number;
  todayAttendance: number;
}

interface PendingPass {
  id: string;
  student_name: string;
  pass_type: string;
  created_at: string;
}

interface ActiveComplaint {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    pendingPasses: 0,
    activeComplaints: 0,
    todayAttendance: 0,
  });
  const [pendingPasses, setPendingPasses] = useState<PendingPass[]>([]);
  const [activeComplaints, setActiveComplaints] = useState<ActiveComplaint[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log("🔍 [Dashboard] Fetching dashboard data...");

      // Fetch total students
      const { count: studentCount, error: studentError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");

      if (studentError) console.error("❌ [Dashboard] Student count error:", studentError);
      console.log("👥 [Dashboard] Total students:", studentCount);

      // Fetch pending passes (only status = 'pending')
      const { count: passCount, data: passData, error: passError } = await supabase
        .from("passes")
        .select(`
          id,
          pass_type,
          created_at,
          profiles!passes_student_id_fkey(full_name)
        `, { count: "exact" })
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      if (passError) console.error("❌ [Dashboard] Passes error:", passError);
      console.log("🎫 [Dashboard] Pending passes count:", passCount);
      console.log("🎫 [Dashboard] Pass data sample:", passData?.slice(0, 2));

      // Fetch active complaints (only status IN 'pending', 'in_progress')
      const { count: complaintCount, data: complaintData, error: complaintError } = await supabase
        .from("complaints")
        .select("id, title, status, priority, created_at", { count: "exact" })
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (complaintError) console.error("❌ [Dashboard] Complaints error:", complaintError);
      console.log("🧾 [Dashboard] Active complaints count:", complaintCount);
      console.log("🧾 [Dashboard] Complaint data sample:", complaintData?.slice(0, 2));

      // Debug: Fetch ALL pass statuses to check casing
      const { data: allPasses } = await supabase
        .from("passes")
        .select("status")
        .limit(10);
      console.log("🔍 [Dashboard] Sample pass statuses (checking case):",
        allPasses?.map(p => `"${p.status}"`).join(", "));

      // Debug: Fetch ALL complaint statuses to check casing
      const { data: allComplaints } = await supabase
        .from("complaints")
        .select("status")
        .limit(10);
      console.log("🔍 [Dashboard] Sample complaint statuses (checking case):",
        allComplaints?.map(c => `"${c.status}"`).join(", "));

      // Fetch today's attendance count
      const today = format(new Date(), "yyyy-MM-dd");
      const { count: attendanceCount, error: attendanceError } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("attendance_date", today)
        .eq("is_present", true);

      if (attendanceError) console.error("❌ [Dashboard] Attendance error:", attendanceError);
      console.log("✅ [Dashboard] Present today:", attendanceCount);

      setStats({
        totalStudents: studentCount || 0,
        pendingPasses: passCount || 0,
        activeComplaints: complaintCount || 0,
        todayAttendance: attendanceCount || 0,
      });

      console.log("📊 [Dashboard] Final stats:", {
        totalStudents: studentCount || 0,
        pendingPasses: passCount || 0,
        activeComplaints: complaintCount || 0,
        todayAttendance: attendanceCount || 0,
      });

      if (passData) {
        setPendingPasses(
          passData.map((p: { id: string; pass_type: string; created_at: string; profiles?: { full_name?: string } | null }) => ({
            id: p.id,
            student_name: p.profiles?.full_name || "Unknown",
            pass_type: p.pass_type,
            created_at: p.created_at,
          }))
        );
      }

      if (complaintData) {
        setActiveComplaints(complaintData as ActiveComplaint[]);
      }
    };

    // Initial fetch
    fetchDashboardData();

    // Refresh when tab/window becomes visible (e.g., after navigating back from other pages)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchDashboardData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup listener on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="space-y-6">
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
        <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="mt-2 text-primary-foreground/80 text-lg font-medium">
              Manage your hostel operations efficiently
            </p>
        </div>
      </motion.div>

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
        className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: "Students", value: stats.totalStudents, icon: Users, color: "primary" },
          { label: "Pending Passes", value: stats.pendingPasses, icon: Ticket, color: "amber-500" },
          { label: "Active Complaints", value: stats.activeComplaints, icon: MessageSquare, color: "red-500" },
          { label: "Present Today", value: stats.todayAttendance, icon: GraduationCap, color: "green-500" },
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
              <CardContent className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-5 p-4 sm:p-6 text-center sm:text-left">
                <div className={cn(
                    "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl shrink-0 transition-transform duration-300",
                    stat.color === "primary" ? "bg-primary/10 text-primary" : `bg-${stat.color.split('-')[0]}-500/10 text-${stat.color}`
                )}>
                  <stat.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-0.5">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Passes */}
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Pass Requests
            </CardTitle>
            <Link to="/admin/passes">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingPasses.length > 0 ? (
              <div className="space-y-3">
                {pendingPasses.map((pass) => (
                  <div
                    key={pass.id}
                    className="flex items-center justify-between rounded-lg border p-2 sm:p-3"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-sm sm:text-base font-medium truncate">{pass.student_name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">
                        {pass.pass_type.replace("_", " ")} Pass
                      </p>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground shrink-0 text-right">
                      {format(new Date(pass.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 p-6 text-center">
                <Ticket className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No pending passes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Complaints */}
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Active Complaints
            </CardTitle>
            <Link to="/admin/complaints">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activeComplaints.length > 0 ? (
              <div className="space-y-3">
                {activeComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="flex items-center justify-between rounded-lg border p-2 sm:p-3"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-sm sm:text-base font-medium truncate">{complaint.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span
                          className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-medium ${complaint.status === "pending"
                            ? "status-pending"
                            : "status-in-progress"
                            }`}
                        >
                          {complaint.status.replace("_", " ")}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-medium priority-${complaint.priority}`}
                        >
                          {complaint.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground shrink-0 text-right">
                      {format(new Date(complaint.created_at), "MMM d")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 p-6 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No active complaints</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/students" className="hover-scale">
          <Card className="card-shadow cursor-pointer border-2 border-transparent transition-colors hover:border-primary/20">
            <CardContent className="flex items-center gap-4 p-4">
              <Users className="h-6 w-6 text-primary" />
              <span className="font-medium">Manage Students</span>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/menu" className="hover-scale">
          <Card className="card-shadow cursor-pointer border-2 border-transparent transition-colors hover:border-primary/20">
            <CardContent className="flex items-center gap-4 p-4">
              <Clock className="h-6 w-6 text-primary" />
              <span className="font-medium">Update Menu</span>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/attendance" className="hover-scale">
          <Card className="card-shadow cursor-pointer border-2 border-transparent transition-colors hover:border-primary/20">
            <CardContent className="flex items-center gap-4 p-4">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              <span className="font-medium">Mark Attendance</span>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/notices" className="hover-scale">
          <Card className="card-shadow cursor-pointer border-2 border-transparent transition-colors hover:border-primary/20">
            <CardContent className="flex items-center gap-4 p-4">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="font-medium">Post Notice</span>
            </CardContent>
          </Card>
        </Link>
      </div>
      </div>
    </div>
  );
}
