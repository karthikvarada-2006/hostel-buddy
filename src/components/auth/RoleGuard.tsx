/**
 * RoleGuard convenience wrappers.
 *
 * These are kept for backward-compatibility but the real enforcement
 * now lives in ProtectedRoute (requiredRole prop).  These wrappers
 * provide an ADDITIONAL defence-in-depth check inside an already-protected
 * route group — e.g. if a route is accidentally placed under the wrong
 * ProtectedRoute group.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type UserRole = "student" | "admin";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { profile, session, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No session → redirect to home (ProtectedRoute should have caught this)
  if (!session) {
    return <Navigate to="/" replace />;
  }

  const userRole = profile?.role as UserRole | null;

  if (!userRole || !allowedRoles.includes(userRole)) {
    // Redirect to user's own dashboard
    const correctDashboard = userRole === "admin" ? "/admin/dashboard" : "/dashboard";
    return <Navigate to={correctDashboard} replace />;
  }

  return <>{children}</>;
}

// Convenience wrapper for admin-only routes
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      {children}
    </RoleGuard>
  );
}

// Convenience wrapper for student-only routes
export function StudentRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["student"]}>
      {children}
    </RoleGuard>
  );
}
