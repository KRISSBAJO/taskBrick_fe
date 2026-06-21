import Link from "next/link";
import { Blocks, ShieldCheck } from "lucide-react";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-dvh bg-[#fffdf3] px-6 py-10 text-[#111111]">
      <div className="mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-6xl items-center">
        <section className="grid w-full overflow-hidden rounded-[28px] border border-[#e8e0c8] bg-white shadow-[0_30px_90px_rgba(17,17,17,0.10)] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[#111111] p-8 text-white sm:p-10">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#ffd400]">
                <Blocks className="size-5 text-[#111111]" aria-hidden="true" />
              </span>
              <span className="text-sm font-black">TaskBricks Enterprise</span>
            </Link>
            <div className="mt-20 max-w-md">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-widest text-[#ffd400]">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Secure recovery
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight">Reset access without exposing accounts.</h1>
              <p className="mt-4 text-sm font-semibold leading-6 text-white/55">
                We send a short-lived, single-use reset link if the account exists. Old sessions are revoked after a successful reset.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center p-8 sm:p-10">
            <div className="w-full max-w-md">
              <h2 className="text-3xl font-black tracking-tight">Forgot password?</h2>
              <p className="mt-2 text-sm font-semibold text-[#68645b]">Enter your workspace and email to receive a reset link.</p>
              <div className="mt-8">
                <ForgotPasswordForm />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
