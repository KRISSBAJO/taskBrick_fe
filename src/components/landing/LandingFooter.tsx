import { ArrowRight, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const footerColumns = [
  {
    title: "Product",
    links: [
      ["Projects", "/projects"],
      ["Sprints", "/sprints"],
      ["Meetings", "/meetings"],
      ["AI actions", "/board/ai"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/#about"],
      ["Pricing", "/#pricing"],
      ["Contact", "/#contact"],
      ["Dashboard", "/dashboard"],
    ],
  },
] as const;

export function LandingFooter() {
  return (
    <footer id="contact" className="border-t border-black/[0.06] bg-[#0b0b0a] px-5 py-12 text-white sm:px-8 lg:px-16">
      <div className="mx-auto max-w-[1280px]">
        <div className="rounded-[26px] border border-white/10 bg-[#11110f] px-6 py-7 shadow-[0_26px_80px_rgba(0,0,0,0.32)] sm:px-8 sm:py-9 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="overflow-hidden rounded-2xl border border-white/10 bg-white">
                  <Image
                    src="/product/taskbrick_logo.png"
                    alt="TaskBricks"
                    width={44}
                    height={44}
                    className="block size-11 object-cover"
                  />
                </span>
                <span className="text-2xl font-black tracking-tight text-white">
                  Task<span className="text-[#ffd400]">Bricks</span>
                </span>
              </Link>

              <p className="mt-8 max-w-2xl text-3xl font-black leading-[1.06] tracking-tight text-white sm:text-4xl">
                Plan, ship, and audit work in one secure workspace.
              </p>
              <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-white/58">
                A focused operating system for projects, sprints, meetings, approvals,
                reporting, and AI-assisted delivery.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#ffd400] px-5 text-sm font-black text-[#111111] shadow-[0_18px_42px_rgba(255,212,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#f5ca00]"
                >
                  Start free trial
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1]"
                >
                  <LayoutDashboard className="size-4 text-[#ffd400]" aria-hidden="true" />
                  Open dashboard
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:max-w-md lg:ml-auto lg:w-full">
              {footerColumns.map((column) => (
                <div key={column.title}>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/38">
                    {column.title}
                  </p>
                  <div className="mt-4 space-y-3">
                    {column.links.map(([label, href]) => (
                      <Link
                        key={label}
                        href={href}
                        className="block text-sm font-bold text-white/68 transition hover:text-[#ffd400]"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-5 text-xs font-bold text-white/42 md:flex-row md:items-center md:justify-between">
            <p>&copy; 2026 TaskBricks. All rights reserved.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/privacy" className="transition hover:text-[#ffd400]">Privacy</Link>
              <Link href="/terms" className="transition hover:text-[#ffd400]">Terms</Link>
              <Link href="/cookies" className="transition hover:text-[#ffd400]">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
