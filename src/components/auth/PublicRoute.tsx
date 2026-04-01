import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface PublicRouteProps {
    children: React.ReactNode;
}

/**
 * Synchronous check for Supabase auth tokens in sessionStorage.
 * Mirrors the same check in ProtectedRoute for consistency.
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
 * Guard for PUBLIC routes (Home, Login, Register, etc.).
 *
 * If the user is already authenticated, they are immediately redirected
 * to their role-appropriate dashboard. This prevents authenticated users
 * from reaching public pages via browser back button or direct URL entry.
 *
 * Uses the same synchronous sessionStorage pre-check as ProtectedRoute
 * for instant redirect with zero flash of public content.
 */
export function PublicRoute({ children }: PublicRouteProps) {
    const { session, profile, isReady } = useAuth();

    // ── FAST PATH: No tokens → definitely not authenticated → render public page
    if (!hasSessionTokens()) {
        return <>{children}</>;
    }

    // ── Auth is still initializing — show a brief spinner instead of
    //    flashing the public page then redirecting.
    if (!isReady) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // ── Authenticated with a known role → redirect to dashboard
    if (session && profile?.role) {
        const dashboardPath =
            profile.role === "admin" ? "/admin/dashboard" : "/dashboard";
        return <Navigate to={dashboardPath} replace />;
    }

    // ── Has tokens but session/profile not confirmed (edge case) → render public page
    return <>{children}</>;
}
