"use client";

import { useState, type SyntheticEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { resetPassword } from "@/lib/api";

const inputBase =
  "h-12 w-full rounded-xl border border-[#e8e0c8] bg-white px-4 text-sm text-[#111111] placeholder:text-[#c0bbb2] transition-all duration-200 focus:border-[#ffd400] focus:outline-none focus:ring-2 focus:ring-[#ffd400]/15";

export function ResetPasswordForm({ token }: { token?: string }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!token) {
      setError("Reset token is missing. Use the link from your email.");
      return;
    }
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({ token, password });
      setSuccess(result.message);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PasswordField id="password" label="New password" name="password" />
      <PasswordField id="confirmPassword" label="Confirm password" name="confirmPassword" />

      <p className="rounded-xl border border-[#e8e0c8] bg-[#fffdf3] px-4 py-3 text-xs font-semibold leading-5 text-[#68645b]">
        Use at least 12 characters with uppercase, lowercase, number, and symbol unless your tenant policy is stricter.
      </p>

      {error ? <Alert tone="error" message={error} /> : null}
      {success ? <Alert tone="success" message={success} /> : null}

      <button
        type="submit"
        disabled={loading || !token}
        className="tb-yellow-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
        Reset password
      </button>

      {success ? (
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-black text-[#111111] underline underline-offset-2">
          Sign in
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </form>
  );
}

function PasswordField({ id, label, name }: { id: string; label: string; name: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-bold text-[#111111]">
        {label}
      </label>
      <div className="relative">
        <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#68645b]" aria-hidden="true" />
        <input id={id} className={`${inputBase} pl-10`} name={name} type="password" minLength={12} required />
      </div>
    </div>
  );
}

function Alert({ message, tone }: { message: string; tone: "error" | "success" }) {
  const success = tone === "success";
  return (
    <div className={success ? "flex items-start gap-2 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-semibold text-[#166534]" : "flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#b91c1c]"}>
      {success ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <span className="mt-px shrink-0">!</span>}
      {message}
    </div>
  );
}
