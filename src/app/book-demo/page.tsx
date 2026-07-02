import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bot, CalendarCheck, ClipboardCheck, ShieldCheck } from "lucide-react";
import { LandingFooter, LandingNav, MarketingLeadForm } from "@/components/landing";

export const metadata: Metadata = {
  title: "Book a TaskBricks Demo",
  description: "Request a TaskBricks product demo for projects, sprints, meetings, AI, QA, and enterprise controls.",
};

const demoTopics = [
  {
    icon: ClipboardCheck,
    title: "Delivery command",
    copy: "Projects, boards, sprints, QA, approvals, and task controls in one operating layer.",
  },
  {
    icon: Bot,
    title: "AI with review",
    copy: "Board summaries, risk scans, action plans, and user-confirmed apply flows.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise controls",
    copy: "Tenant isolation, RBAC, audit trails, internal mail, billing, and platform admin views.",
  },
] as const;

export default function BookDemoPage() {
  return (
    <main className="min-h-dvh bg-white text-[#111111]">
      <LandingNav />

      <section className="px-5 py-10 sm:px-8 lg:px-16 lg:py-14">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 text-sm font-black text-[#111111] shadow-sm transition hover:border-[#ffd400]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back home
            </Link>

            <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#68645b] shadow-sm">
              <CalendarCheck className="size-4 text-[#b28b00]" aria-hidden="true" />
              Product demo
            </p>
            <h1 className="mt-5 max-w-xl text-[44px] font-black leading-[0.98] tracking-tight text-[#111111] sm:text-[58px]">
              See TaskBricks around your workflow.
            </h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-[#5f5a50]">
              Request a focused walkthrough for your team. We will use your role, team size,
              preferred time, and notes to tailor the demo to the parts of TaskBricks that matter.
            </p>

            <div className="mt-8 grid gap-3">
              {demoTopics.map((item) => (
                <div key={item.title} className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-sm">
                  <div className="flex gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#111111] text-[#ffd400]">
                      <item.icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-sm font-black text-[#111111]">{item.title}</h2>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#68645b]">{item.copy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-black/[0.08] bg-white p-4 text-sm font-semibold leading-6 text-[#68645b] shadow-sm">
              Need to send a general message instead?
              <Link href="/contact" className="ml-1 font-black text-[#111111] underline decoration-[#ffd400] underline-offset-4">
                Contact us
              </Link>
              .
            </div>
          </div>

          <MarketingLeadForm mode="demo" />
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
