import { useEffect, useRef } from "react";
import { API_URL } from "../constants";
import { supabase } from "./supabase";

interface UseAccessGuardOptions {
  enabled: boolean;
  onRevoked: (message: string) => void;
}

const REVOKED_MESSAGE =
  "Your access has been turned off. Please contact your administrator.";

export function useAccessGuard({ enabled, onRevoked }: UseAccessGuardOptions) {
  const activeRunRef = useRef<symbol | null>(null);
  const onRevokedRef = useRef(onRevoked);
  onRevokedRef.current = onRevoked;

  useEffect(() => {
    if (!enabled) {
      activeRunRef.current = null;
      return;
    }

    let cancelled = false;

    const checkAccess = async () => {
      if (cancelled || activeRunRef.current !== null) return;
      const runToken = Symbol("access-check");
      activeRunRef.current = runToken;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled || !session?.access_token) {
          return;
        }

        const res = await fetch(`${API_URL}/auth/access-status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (cancelled) return;

        if (res.status === 401) {
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore signOut errors
          }
          if (!cancelled) {
            onRevokedRef.current(REVOKED_MESSAGE);
          }
          return;
        }

        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (!cancelled && data && data.active === false) {
            try {
              await supabase.auth.signOut();
            } catch {
              // ignore signOut errors
            }
            if (!cancelled) {
              onRevokedRef.current(REVOKED_MESSAGE);
            }
          }
        }
        // Network errors or non-401 server errors (e.g. HTTP 500): do nothing; retry on next trigger.
      } catch {
        // Network error: do nothing; retry on next trigger.
      } finally {
        if (activeRunRef.current === runToken) {
          activeRunRef.current = null;
        }
      }
    };

    const intervalId = window.setInterval(checkAccess, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAccess();
      }
    };

    const handleFocus = () => {
      checkAccess();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      activeRunRef.current = null;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled]);
}
