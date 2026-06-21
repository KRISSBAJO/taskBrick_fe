"use client";

import { useState, type SyntheticEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { forgotPassword } from "@/lib/api";

const inputBase =
  "h-12 w-full rounded-xl border border-[#e8e0c8] bg-white px-4 text-sm text-[#111111] placeholder:text-[#c0bbb2] transition-all duration-200 focus:border-[#ffd400] focus:outline-none focus:ring-2 focus:ring-[#ffd400]/15";

export function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ message: string; devLink?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await forgotPassword({
        tenantSlug: String(formData.get("tenantSlug") ?? ""),
        email: String(formData.get("email") ?? ""),
      });
      setSuccess({ message: result.message, devLink: result.devLink });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to request reset link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="tenantSlug" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
          Workspace
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#68645b]">
            @
          </span>
          <input id="tenantSlug" className={`${inputBase} pl-8`} name="tenantSlug" placeholder="demo" required />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
          Email address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#68645b]" aria-hidden="true" />
          <input id="email" className={`${inputBase} pl-10`} name="email" placeholder="you@company.com" type="email" required />
        </div>
      </div>

      {error ? <Alert tone="error" message={error} /> : null}
      {success ? <Alert tone="success" message={success.message} devLink={success.devLink} /> : null}

      <button
        type="submit"
        disabled={loading}
        className="tb-yellow-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Mail className="size-4" aria-hidden="true" />}
        Send reset link
      </button>

      <Link href="/login" className="inline-flex items-center gap-2 text-sm font-black text-[#111111] underline underline-offset-2">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to sign in
      </Link>
    </form>
  );
}

function Alert({ devLink, message, tone }: { devLink?: string; message: string; tone: "error" | "success" }) {
  const success = tone === "success";
  return (
    <div className={success ? "rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-semibold text-[#166534]" : "rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#b91c1c]"}>
      <div className="flex items-start gap-2">
        {success ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <span className="mt-px shrink-0">!</span>}
        <span>{message}</span>
      </div>
      {devLink ? (
        <Link href={devLink} className="mt-2 block break-all text-xs font-black text-[#111111] underline underline-offset-2">
          Open local reset link
        </Link>
      ) : null}
    </div>
  );
}
