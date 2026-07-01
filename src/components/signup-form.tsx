"use client";

import { useState, type SyntheticEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building, KeyRound, Loader2, Mail } from "lucide-react";
import { register, setStoredAuth } from "@/lib/api";

const inputBase =
  "h-11 w-full rounded-xl border border-[#e8e0c8] bg-white px-4 text-sm font-semibold text-[#111111] placeholder:text-[#b9b2a3] transition-all duration-200 focus:border-[#ffd400] focus:outline-none focus:ring-2 focus:ring-[#ffd400]/15";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await register({
        tenantName: String(formData.get("tenantName") ?? ""),
        tenantSlug: String(formData.get("tenantSlug") ?? ""),
        firstName: String(formData.get("firstName") ?? ""),
        lastName: String(formData.get("lastName") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
      if ("accessToken" in result) {
        setStoredAuth(result);
        router.push("/dashboard");
        return;
      }

      const params = new URLSearchParams();
      params.set("message", result.message);
      if (result.email) params.set("email", result.email);
      if (result.tenantSlug) params.set("tenantSlug", result.tenantSlug);
      if (result.delivery?.status) params.set("deliveryStatus", result.delivery.status);
      if (result.delivery?.provider) params.set("deliveryProvider", result.delivery.provider);
      if (result.devLink) params.set("devLink", result.devLink);

      const query = params.toString();
      router.push(`/verify-email${query ? `?${query}` : ""}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div className="grid gap-3.5 sm:grid-cols-[minmax(0,1.2fr)_minmax(160px,0.8fr)]">
        <div>
          <label htmlFor="tenantName" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
            Organization
          </label>
          <div className="relative">
            <Building
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#68645b]"
              aria-hidden="true"
            />
            <input
              id="tenantName"
              className={`${inputBase} pl-10`}
              name="tenantName"
              placeholder="Acme Inc."
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="tenantSlug" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
            Workspace
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#68645b]">
              @
            </span>
            <input
              id="tenantSlug"
              className={`${inputBase} pl-8`}
              name="tenantSlug"
              placeholder="acme"
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
            First name
          </label>
          <input id="firstName" className={inputBase} name="firstName" placeholder="Ada" required />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
            Last name
          </label>
          <input id="lastName" className={inputBase} name="lastName" placeholder="Lovelace" required />
        </div>
      </div>

      <div>
        <label htmlFor="signup-email" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
          Work email
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#68645b]"
            aria-hidden="true"
          />
          <input
            id="signup-email"
            className={`${inputBase} pl-10`}
            name="email"
            placeholder="ada@acme.com"
            type="email"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="signup-password" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
          Password
        </label>
        <div className="relative">
          <KeyRound
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#68645b]"
            aria-hidden="true"
          />
          <input
            id="signup-password"
            className={`${inputBase} pl-10`}
            name="password"
            type="password"
            placeholder="Min. 12 characters"
            minLength={12}
            required
          />
        </div>
        <p className="mt-1 text-[11px] font-semibold text-[#68645b]">12+ characters with uppercase, lowercase, number, and symbol.</p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]">
          <span className="mt-px shrink-0">!</span>
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="tb-yellow-button mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Creating workspace...
          </>
        ) : (
          <>
            Create workspace
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </button>

      <p className="text-center text-sm text-[#68645b]">
        Already have a workspace?{" "}
        <Link href="/login" className="font-black text-[#111111] underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </form>
  );
}
