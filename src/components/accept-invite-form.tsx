"use client";

import { useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, KeyRound, Loader2, UserRound } from "lucide-react";
import { acceptInvite, setStoredAuth } from "@/lib/api";

const inputBase =
  "h-12 w-full rounded-xl border border-[#e8e0c8] bg-white px-4 text-sm text-[#111111] placeholder:text-[#c0bbb2] transition-all duration-200 focus:border-[#ffd400] focus:outline-none focus:ring-2 focus:ring-[#ffd400]/15";

export function AcceptInviteForm({ token }: { token?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("Invite token is missing. Use the link from your invitation email.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await acceptInvite({
        token,
        firstName: String(formData.get("firstName") ?? ""),
        lastName: String(formData.get("lastName") ?? ""),
        password,
      });
      setStoredAuth(result);
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to accept invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
            First name
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#68645b]" aria-hidden="true" />
            <input id="firstName" className={`${inputBase} pl-10`} name="firstName" placeholder="Ada" />
          </div>
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
            Last name
          </label>
          <input id="lastName" className={inputBase} name="lastName" placeholder="Lovelace" />
        </div>
      </div>

      <PasswordField id="password" label="Password" name="password" />
      <PasswordField id="confirmPassword" label="Confirm password" name="confirmPassword" />

      <p className="rounded-xl border border-[#e8e0c8] bg-[#fffdf3] px-4 py-3 text-xs font-semibold leading-5 text-[#68645b]">
        Accepting this invite verifies your email and activates your tenant account.
      </p>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#b91c1c]">
          <span className="mt-px shrink-0">!</span>
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading || !token}
        className="tb-yellow-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black disabled:opacity-70"
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
        Activate account
      </button>

      <Link href="/login" className="text-sm font-black text-[#111111] underline underline-offset-2">
        Already active? Sign in
      </Link>
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
