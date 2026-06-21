import Link from "next/link";
import { Blocks, MailCheck } from "lucide-react";
import { VerifyEmailPanel } from "@/components/verify-email-panel";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="min-h-dvh bg-[#fffdf3] px-6 py-10 text-[#111111]">
      <div className="mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-5xl items-center justify-center">
        <section className="w-full max-w-xl rounded-[28px] border border-[#e8e0c8] bg-white p-8 shadow-[0_30px_90px_rgba(17,17,17,0.10)] sm:p-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#111111]">
              <Blocks className="size-5 text-[#ffd400]" aria-hidden="true" />
            </span>
            <span className="text-sm font-black">TaskBricks Enterprise</span>
          </Link>
          <span className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#e8e0c8] bg-[#fffdf3] px-3 py-1 text-xs font-black uppercase tracking-widest text-[#68645b]">
            <MailCheck className="size-4 text-[#111111]" aria-hidden="true" />
            Email verification
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-tight">{token ? "Verifying your email" : "Resend verification"}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#68645b]">
            {token
              ? "We are confirming your email and preparing your workspace session."
              : "Enter your workspace and email address to receive a fresh verification link."}
          </p>
          <div className="mt-8">
            <VerifyEmailPanel token={token} />
          </div>
        </section>
      </div>
    </main>
  );
}
