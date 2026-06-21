import Link from "next/link";
import { Blocks, CheckCircle2, LockKeyhole, ShieldCheck, Workflow } from "lucide-react";
import { LoginForm } from "@/components/login-form";

const assurances = [
  { icon: ShieldCheck, label: "Tenant-isolated workspaces" },
  { icon: LockKeyhole, label: "Verified identity and session controls" },
  { icon: Workflow, label: "Projects, boards, sprints, and reporting" },
];

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-[#fffdf3] text-[#111111]">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.1fr)]">
        <section className="relative hidden overflow-hidden bg-[#111111] text-white lg:flex">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.045]"
            style={{
              backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative flex min-h-full w-full flex-col justify-between p-10 xl:p-14">
            <Link href="/" className="flex w-fit items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#ffd400] shadow-[0_18px_42px_rgba(255,212,0,0.22)]">
                <Blocks className="size-6 text-[#111111]" aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block text-base font-black">TaskBricks</span>
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/35">Enterprise</span>
              </span>
            </Link>

            <div className="max-w-xl">
              <span className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffd400]">
                Enterprise work management
              </span>
              <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-tight xl:text-6xl">
                Sign in to the workspace that keeps delivery clear.
              </h1>
              <p className="mt-6 max-w-md text-base font-semibold leading-7 text-white/52">
                Manage work, people, security, and decisions from one controlled tenant environment.
              </p>
            </div>

            <div className="grid gap-3">
              {assurances.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#ffd400]/12 text-[#ffd400]">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-bold text-white/68">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-dvh flex-col px-6 py-8 sm:px-10 lg:px-16">
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#111111]">
                <Blocks className="size-5 text-[#ffd400]" aria-hidden="true" />
              </span>
              <span className="text-sm font-black">TaskBricks</span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-[448px]">
              <div className="mb-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#e8e0c8] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#68645b]">
                  <CheckCircle2 className="size-3.5 text-[#22c55e]" aria-hidden="true" />
                  Secure access
                </span>
                <h2 className="mt-5 text-4xl font-black tracking-tight text-[#111111]">Welcome back</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#68645b]">
                  Enter your workspace, email, and password to continue.
                </p>
              </div>

              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
