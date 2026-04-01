import { useAuth } from "@/contexts/AuthContext";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

export default function Dashboard() {
  const { isAdmin } = useAuth();

  return isAdmin ? <AdminDashboard /> : <StudentDashboard />;
}
