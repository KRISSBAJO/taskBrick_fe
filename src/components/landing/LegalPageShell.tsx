import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";

type LegalSection = {
  title: string;
  body: string;
};

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
};

export function LegalPageShell({ eyebrow, title, description, sections }: LegalPageShellProps) {
  return (
    <main className="min-h-dvh bg-white text-[#111111]">
      <LandingNav />
      <section className="px-5 py-12 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-black text-[#111111] shadow-sm transition hover:border-[#ffd400]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to home
          </Link>

          <div className="mt-10 rounded-[28px] border border-black/[0.08] bg-white p-7 shadow-[0_28px_90px_rgba(17,17,17,0.08)] sm:p-10">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#b28b00]">
              {eyebrow}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#68645b]">
              {description}
            </p>

            <div className="mt-9 divide-y divide-black/[0.08]">
              {sections.map((section) => (
                <section key={section.title} className="py-6 first:pt-0 last:pb-0">
                  <h2 className="text-lg font-black">{section.title}</h2>
                  <p className="mt-3 text-sm font-semibold leading-7 text-[#68645b]">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>
      <LandingFooter />
    </main>
  );
}
