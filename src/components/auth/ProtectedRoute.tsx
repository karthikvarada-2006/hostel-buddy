import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: "student" | "admin";
}

/**
 * Check sessionStorage synchronously for Supabase auth tokens.
 * This provides an INSTANT pre-check before React state is even consulted,
 * eliminating any timing gap where stale React state could let content through.
 */
function hasSessionTokens(): boolean {
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
      return true;
    }
  }
  return false;
}

/**
 * Centralized auth guard with strict 3-state model + synchronous pre-check:
 *
 *   0. SYNCHRONOUS PRE-CHECK → if no tokens in sessionStorage, redirect INSTANTLY
 *   1. LOADING  → full-screen spinner, zero protected content rendered
 *   2. UNAUTHENTICATED → immediate redirect to role-appropriate login
 *   3. AUTHENTICATED + WRONG ROLE → redirect to user's own dashboard
 *
 * Only when loading === false AND session exists AND role matches
 * does the protected content render.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { session, profile, isReady } = useAuth();
  const location = useLocation();

  const loginPath = requiredRole === "admin" ? "/admin/login" : "/student/login";

  // ──── STATE 0: SYNCHRONOUS PRE-CHECK ────
  // Before even consulting React state, check sessionStorage directly.
  // After logout, sessionStorage is cleared, so this fires INSTANTLY
  // on any back/forward navigation — no async gap, no stale state.
  if (!hasSessionTokens()) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // ──── STATE 1: LOADING ────
  // Auth is still initializing — render NOTHING except a spinner.
  // This guarantees zero frames of protected content are ever shown.
  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ──── STATE 2: UNAUTHENTICATED ────
  // No valid session → redirect to the login page for the *required* role.
  if (!session) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // ──── STATE 3: AUTHENTICATED — verify role ────
  const userRole = profile?.role;

  // Profile not loaded yet (edge case: session exists but profile fetch
  // hasn't resolved) — show spinner rather than flashing content.
  if (!userRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Role mismatch — redirect to the user's own dashboard.
  if (userRole !== requiredRole) {
    const correctDashboard = userRole === "admin" ? "/admin/dashboard" : "/dashboard";
    return <Navigate to={correctDashboard} replace />;
  }

  // ✅ Authenticated + correct role — render protected content
  return <>{children}</>;
}
