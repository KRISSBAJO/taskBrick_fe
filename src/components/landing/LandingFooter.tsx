import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const footerColumns = [
  {
    title: "Platform",
    links: [
      ["Projects", "#services"],
      ["Sprints", "#services"],
      ["Meetings", "#services"],
      ["Internal mail", "#services"],
    ],
  },
  {
    title: "Operations",
    links: [
      ["Approvals", "#services"],
      ["Reports", "#services"],
      ["Automation", "#services"],
      ["AI workspace", "#services"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "#about"],
      ["Pricing", "#pricing"],
      ["Contact", "#contact"],
      ["Dashboard", "/dashboard"],
    ],
  },
] as const;

const proofItems = [
  "Tenant-scoped permissions",
  "Auditable AI actions",
  "Secure workspace mail",
] as const;

export function LandingFooter() {
  return (
    <footer id="contact" className="border-t border-black/[0.06] bg-[#0b0b0a] px-5 py-10 text-white sm:px-8 lg:px-16">
      <div className="mx-auto max-w-[1280px]">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#141411_0%,#0b0b0a_48%,#1b1707_100%)] shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
              <div className="absolute left-0 top-0 h-28 w-28 rounded-full bg-[#ffd400]/20 blur-3xl" />
              <div className="relative">
                <Link href="/" className="inline-flex items-center gap-3">
                  <span className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_18px_44px_rgba(255,212,0,0.18)]">
                    <Image
                      src="/product/taskbrick_logo.png"
                      alt="TaskBricks"
                      width={48}
                      height={48}
                      className="block size-12 object-cover"
                    />
                  </span>
                  <span className="text-2xl font-black tracking-tight text-white">
                    Task<span className="text-[#ffd400]">Bricks</span>
                  </span>
                </Link>

                <p className="mt-7 max-w-xl text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-4xl">
                  One secure command center for delivery teams.
                </p>
                <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-white/62 sm:text-base">
                  Run projects, boards, sprints, meetings, approvals, internal mail, reporting,
                  and reviewed AI actions from one enterprise workspace.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/signup"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#ffd400] px-5 text-sm font-black text-[#111111] shadow-[0_18px_42px_rgba(255,212,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#f5ca00]"
                  >
                    Start free trial
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.07] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.11]"
                  >
                    <LayoutDashboard className="size-4 text-[#ffd400]" aria-hidden="true" />
                    Open dashboard
                  </Link>
                </div>

                <div className="mt-8 grid gap-2 sm:grid-cols-3">
                  {proofItems.map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5">
                      <CheckCircle2 className="size-4 shrink-0 text-[#ffd400]" aria-hidden="true" />
                      <span className="text-xs font-black uppercase tracking-[0.08em] text-white/72">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#ffd400] text-[#111111]">
                    <Sparkles className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-[#ffd400]">
                      Workspace ready
                    </p>
                    <p className="mt-1 text-lg font-black leading-tight text-white">
                      Move from scattered tools to one accountable operating system.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-7 sm:grid-cols-3">
                {footerColumns.map((column) => (
                  <div key={column.title}>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/42">
                      {column.title}
                    </p>
                    <div className="mt-4 space-y-3">
                      {column.links.map(([label, href]) => (
                        <Link
                          key={label}
                          href={href}
                          className="block text-sm font-bold text-white/72 transition hover:text-[#ffd400]"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <ShieldCheck className="size-5 text-[#ffd400]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-black text-white">Security first</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-white/50">
                    Role-aware access, audit trails, and workspace isolation.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <Mail className="size-5 text-[#ffd400]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-black text-white">Internal delivery mail</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-white/50">
                    Tenant mailboxes stay inside the workspace boundary.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 px-6 py-5 text-xs font-bold text-white/48 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
            <p>&copy; 2026 TaskBricks. All rights reserved.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a href="#contact" className="transition hover:text-[#ffd400]">Privacy</a>
              <a href="#contact" className="transition hover:text-[#ffd400]">Terms</a>
              <a href="#contact" className="transition hover:text-[#ffd400]">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
