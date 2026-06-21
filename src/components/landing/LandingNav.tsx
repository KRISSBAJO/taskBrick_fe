"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { landingNavLinks } from "./landing-data";
import { getStoredAuth, clearStoredAuth, logoutSession, type AuthUser } from "@/lib/api";

export function LandingNav() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuth()?.user ?? null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleLogout() {
    const token = getStoredAuth()?.accessToken;
    void logoutSession(token).finally(() => {
      clearStoredAuth();
      setUser(null);
      setOpen(false);
      router.push("/");
    });
  }

  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#020202]/92 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-16">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="overflow-hidden rounded-xl shadow-[0_4px_20px_rgba(255,212,0,0.22)]">
            <Image
              src="/product/taskbricks_logo2.png"
              alt="TaskBricks"
              width={40}
              height={40}
              className="block"
              priority
            />
          </span>
          <span className="text-[18px] font-black tracking-tight text-white">
            Task<span className="text-[#ffd400]">Bricks</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Landing navigation">
          {landingNavLinks.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="rounded-md px-3 py-2 text-sm font-semibold text-white/66 transition hover:bg-white/[0.07] hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.1] bg-white/[0.045] px-3 py-2 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:border-white/[0.18] hover:bg-white/[0.08]"
                aria-expanded={open}
                aria-haspopup="true"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#ffd400] text-[11px] font-black text-[#111111]">
                  {initials}
                </span>
                <span className="hidden max-w-[120px] truncate sm:block">
                  {user.firstName} {user.lastName}
                </span>
                <ChevronDown
                  className={`size-3.5 shrink-0 text-white/55 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {open && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-xl border border-white/[0.1] bg-[#101010] text-white shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
                  <div className="border-b border-white/[0.08] px-4 py-3">
                    <p className="text-xs font-black text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-white/50">
                      {user.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                    >
                      <LayoutDashboard className="size-4 text-[#ffd400]" aria-hidden="true" />
                      Go to Dashboard
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-10 w-[120px] items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.04] text-sm font-semibold text-white shadow-sm backdrop-blur-xl transition hover:border-white/[0.2] hover:bg-white/[0.08] sm:inline-flex"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#ffd400] px-4 text-sm font-black text-[#111111] shadow-[0_14px_34px_rgba(255,212,0,0.16)] transition hover:bg-[#f2c200]"
              >
                Start Your Free Trial
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
