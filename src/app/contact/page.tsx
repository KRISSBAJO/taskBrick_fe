import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck, Workflow } from "lucide-react";
import { LandingFooter, LandingNav, MarketingLeadForm } from "@/components/landing";

export const metadata: Metadata = {
  title: "Contact TaskBricks",
  description: "Contact the TaskBricks team for product, sales, implementation, and support questions.",
};

const contactSignals = [
  {
    icon: Mail,
    title: "One intake path",
    copy: "Sales, product, implementation, and partnership messages land in a durable lead queue.",
  },
  {
    icon: ShieldCheck,
    title: "Production ready",
    copy: "Requests are stored first, then routed through the configured TaskBricks mail provider.",
  },
  {
    icon: Workflow,
    title: "Fast handoff",
    copy: "Your message includes source context so the right team can respond with fewer follow-up questions.",
  },
] as const;

export default function ContactPage() {
  return (
    <main className="min-h-dvh bg-[#f7f6ef] text-[#111111]">
      <LandingNav />

      <section className="px-5 py-10 sm:px-8 lg:px-16 lg:py-14">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 text-sm font-black text-[#111111] shadow-sm transition hover:border-[#ffd400]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back home
            </Link>

            <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#68645b] shadow-sm">
              <span className="size-2 rounded-full bg-[#ffd400]" />
              Contact
            </p>
            <h1 className="mt-5 max-w-xl text-[44px] font-black leading-[0.98] tracking-tight text-[#111111] sm:text-[58px]">
              Talk to the TaskBricks team.
            </h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-[#5f5a50]">
              Send us product questions, rollout plans, sales requests, or implementation notes.
              The backend stores every request before attempting email delivery, so nothing disappears
              if a mail provider is unavailable.
            </p>

            <div className="mt-8 space-y-3">
              {contactSignals.map((item) => (
                <div key={item.title} className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-sm">
                  <div className="flex gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff4bf] text-[#111111]">
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

            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800">
              <CheckCircle2 className="mr-2 inline size-4 align-[-2px]" aria-hidden="true" />
              For scheduling a product walkthrough, use the dedicated demo form.
              <Link href="/book-demo" className="ml-1 underline underline-offset-4">
                Book a demo
              </Link>
              .
            </div>
          </div>

          <MarketingLeadForm mode="contact" />
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
