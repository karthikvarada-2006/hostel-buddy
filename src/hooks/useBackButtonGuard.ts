import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Traps the browser back button while mounted on a protected route.
 *
 * How it works:
 *   1. On mount (and every route change within the protected area),
 *      pushes the current URL onto the history stack as a duplicate.
 *   2. Listens for the `popstate` event (back/forward button).
 *   3. When `popstate` fires, immediately pushes the current location
 *      back, preventing the browser from leaving the protected area.
 *
 * The net effect: pressing Back effectively does nothing — the user
 * stays on the current protected page.
 *
 * This hook should be called inside AppLayout so it only runs while
 * the user is on an authenticated route.
 */
export function useBackButtonGuard() {
    const location = useLocation();

    useEffect(() => {
        // Push a duplicate entry so there's something to "go back" to
        // without actually leaving the protected area.
        window.history.pushState(null, "", window.location.href);

        const handlePopState = () => {
            // Immediately push forward again, cancelling the back navigation
            window.history.pushState(null, "", window.location.href);
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [location.pathname]);
}
