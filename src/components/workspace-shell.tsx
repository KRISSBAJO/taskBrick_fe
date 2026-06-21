"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AUTH_UPDATED_EVENT,
  ApiError,
  clearStoredAuth,
  getMe,
  getStoredAuth,
  logoutSession,
  refreshSession,
  setStoredAuth,
  type AuthUser,
  type StoredAuth,
} from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { ConfirmProvider } from "@/components/confirm-provider";
import { RealtimeProvider } from "@/components/realtime-provider";
import { ToastProvider } from "@/components/toast-provider";

type WorkspaceAuthContextValue = {
  auth: StoredAuth;
  user: AuthUser;
  sessionWarning: string;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
};

type AuthenticatedSessionProviderProps = {
  children: (value: WorkspaceAuthContextValue) => ReactNode;
  loadingTitle?: string;
  loadingSubtitle?: string;
  loadingClassName?: string;
};

const WorkspaceAuthContext = createContext<WorkspaceAuthContextValue | null>(null);

export function useWorkspaceAuth() {
  const context = useContext(WorkspaceAuthContext);

  if (!context) {
    throw new Error("useWorkspaceAuth must be used inside WorkspaceShell.");
  }

  return context;
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedSessionProvider>
      {(value) => (
        <ToastProvider>
          <ConfirmProvider>
            <RealtimeProvider token={value.auth.accessToken}>
              <div className="flex min-h-dvh bg-background">
                <Sidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Topbar />
                  {value.sessionWarning ? (
                    <div className="border-b border-[#f4d27b] bg-[#fff7df] px-4 py-2 text-sm font-medium text-[#8a3f08] md:px-6">
                      {value.sessionWarning}
                    </div>
                  ) : null}
                  <main className="min-w-0 flex-1 px-4 py-5 md:px-6">{children}</main>
                </div>
              </div>
            </RealtimeProvider>
          </ConfirmProvider>
        </ToastProvider>
      )}
    </AuthenticatedSessionProvider>
  );
}

export function AuthenticatedSessionProvider({
  children,
  loadingClassName = "bg-background",
  loadingSubtitle = "Checking local session state.",
  loadingTitle = "Preparing your workspace...",
}: AuthenticatedSessionProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [sessionWarning, setSessionWarning] = useState("");

  useEffect(() => {
    async function refreshBrowserSession() {
      const refreshed = await refreshSession();
      setStoredAuth(refreshed);
      setAuth(refreshed);
      setSessionWarning("");
    }

    async function validateSession(current: StoredAuth) {
      try {
        const user = await getMe(current.accessToken);
        setAuth({ ...current, user });
        setSessionWarning("");
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) {
          try {
            await refreshBrowserSession();
            return;
          } catch {
            clearStoredAuth();
            router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
            return;
          }
        }

        clearStoredAuth();
        router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
      }
    }

    const timeout = window.setTimeout(() => {
      const stored = getStoredAuth();

      if (!stored) {
        void refreshBrowserSession()
          .catch(() => {
            clearStoredAuth();
            router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
          })
          .finally(() => {
            setInitializing(false);
          });
        return;
      }

      void validateSession(stored).finally(() => {
        setInitializing(false);
      });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [pathname, router]);

  useEffect(() => {
    function handleAuthUpdated(event: Event) {
      const next = (event as CustomEvent<StoredAuth | null>).detail;

      if (!next) {
        setAuth(null);
        router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
        return;
      }

      setAuth(next);
      setSessionWarning("");
    }

    window.addEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);

    return () => {
      window.removeEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
    };
  }, [pathname, router]);

  const value = useMemo<WorkspaceAuthContextValue | null>(() => {
    if (!auth) {
      return null;
    }

    return {
      auth,
      user: auth.user,
      sessionWarning,
      updateUser: (user: AuthUser) => {
        const next = { ...auth, user };
        setStoredAuth(next);
        setAuth(next);
      },
      logout: () => {
        const token = auth.accessToken;
        void logoutSession(token).finally(() => {
          clearStoredAuth();
          router.replace("/login");
        });
      },
    };
  }, [auth, router, sessionWarning]);

  if (initializing || !value) {
    return (
      <div className={`flex min-h-dvh items-center justify-center px-5 text-center ${loadingClassName}`}>
        <div className="rounded-md border border-line bg-panel p-6 shadow-sm">
          <p className="text-sm font-semibold text-foreground">{loadingTitle}</p>
          <p className="mt-2 text-xs text-ink-soft">{loadingSubtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceAuthContext.Provider value={value}>
      {children(value)}
    </WorkspaceAuthContext.Provider>
  );
}
