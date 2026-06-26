"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
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
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMobileSidebarOpen(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <AuthenticatedSessionProvider>
      {(value) => (
        <ToastProvider>
          <ConfirmProvider>
            <RealtimeProvider token={value.auth.accessToken}>
              <div className="flex min-h-dvh overflow-x-hidden bg-background">
                {mobileSidebarOpen ? (
                  <button
                    type="button"
                    aria-label="Close workspace navigation"
                    className="fixed inset-0 z-40 bg-[#111111]/38 backdrop-blur-[2px] lg:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                  />
                ) : null}
                <Sidebar
                  mobileOpen={mobileSidebarOpen}
                  onMobileClose={() => setMobileSidebarOpen(false)}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Topbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
                  {value.sessionWarning ? (
                    <div className="border-b border-[#f4d27b] bg-[#fff7df] px-4 py-2 text-sm font-medium text-[#8a3f08] md:px-6">
                      {value.sessionWarning}
                    </div>
                  ) : null}
                  <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-4 md:px-6 md:py-5">{children}</main>
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
      <div className={`relative flex min-h-dvh items-center justify-center overflow-hidden px-5 text-center ${loadingClassName}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,212,0,0.18),transparent_34%),linear-gradient(180deg,#fffdf6_0%,#ffffff_65%)]" />
        <div className="relative w-full max-w-[430px] rounded-[28px] border border-line bg-white/92 p-6 shadow-[0_28px_80px_rgba(17,17,17,0.10)] backdrop-blur">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-line bg-white shadow-sm">
            <Image
              src="/product/taskbrick_logo.png"
              alt="TaskBricks"
              width={34}
              height={34}
              className="size-8 object-contain"
              priority
            />
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary-dark">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Secure workspace
          </div>
          <p className="mt-3 text-lg font-black text-foreground">{loadingTitle}</p>
          <p className="mt-2 text-sm font-semibold text-ink-soft">{loadingSubtitle}</p>

          <div className="mt-6 overflow-hidden rounded-full bg-panel-muted">
            <span className="block h-1.5 w-1/2 origin-left rounded-full bg-primary shadow-[0_0_24px_rgba(255,212,0,0.55)] animate-[tb-loading-bar_1.45s_ease-in-out_infinite]" />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-left">
            {["Session", "Access", "Realtime"].map((label, index) => (
              <div key={label} className="rounded-2xl border border-line bg-[#fbfaf6] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">{label}</span>
                  <Loader2
                    className="size-3 animate-spin text-primary-dark"
                    aria-hidden="true"
                    style={{ animationDelay: `${index * 120}ms` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
