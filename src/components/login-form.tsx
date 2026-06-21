"use client";

import { useRef, useState, type SyntheticEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import {
  discoverSso,
  getTrustedDeviceToken,
  login,
  setStoredAuth,
  startSso,
  verifyMfaLogin,
  type MfaChallengeResponse,
  type SsoProvider,
} from "@/lib/api";

const inputBase =
  "h-11 w-full rounded-xl border border-[#e8e0c8] bg-white px-4 text-sm font-semibold text-[#111111] placeholder:text-[#b9b2a3] transition-all duration-200 focus:border-[#ffd400] focus:outline-none focus:ring-2 focus:ring-[#ffd400]/15";

export function LoginForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [challenge, setChallenge] = useState<MfaChallengeResponse | null>(null);
  const [ssoProviders, setSsoProviders] = useState<SsoProvider[]>([]);
  const [ssoTenantSlug, setSsoTenantSlug] = useState("");
  const [ssoRequired, setSsoRequired] = useState(false);

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await login({
        tenantSlug: String(formData.get("tenantSlug") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        trustedDeviceToken: getTrustedDeviceToken(),
      });
      if ("requiresMfa" in result && result.requiresMfa) {
        setChallenge(result);
        return;
      }
      if (!("accessToken" in result)) {
        setError("Unexpected login response. Try signing in again.");
        return;
      }
      setStoredAuth(result);
      const nextPath =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;

      router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  async function onMfaSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge) return;
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await verifyMfaLogin({
        mfaToken: challenge.mfaToken,
        code: String(formData.get("code") ?? ""),
        rememberDevice: formData.get("rememberDevice") === "on",
        deviceName: "Current browser",
      });
      setStoredAuth(result);
      const nextPath =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to verify MFA code");
    } finally {
      setLoading(false);
    }
  }

  async function onDiscoverSso() {
    if (!formRef.current) return;
    setError("");
    setSsoLoading(true);
    const formData = new FormData(formRef.current);
    const tenantSlug = String(formData.get("tenantSlug") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    try {
      const result = await discoverSso({ email, tenantSlug });
      setSsoProviders(result.providers);
      setSsoTenantSlug(result.tenant?.slug ?? tenantSlug);
      setSsoRequired(Boolean(result.ssoRequired));
      if (!result.providers.length) {
        setError("No active SSO provider is configured for this workspace or email domain.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to discover SSO providers.");
    } finally {
      setSsoLoading(false);
    }
  }

  async function onStartSso(provider: SsoProvider) {
    if (!formRef.current) return;
    setError("");
    setSsoLoading(true);
    const formData = new FormData(formRef.current);
    const tenantSlug = ssoTenantSlug || String(formData.get("tenantSlug") ?? "").trim();

    try {
      const redirectUri = `${window.location.origin}/sso/callback`;
      const result = await startSso({ tenantSlug, providerId: provider.id, redirectUri });
      window.location.assign(result.authorizationUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start SSO.");
      setSsoLoading(false);
    }
  }

  if (challenge) {
    return (
      <form onSubmit={onMfaSubmit} className="space-y-3.5">
        <div className="rounded-2xl border border-[#e8e0c8] bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#111111] text-[#ffd400]">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-black text-[#111111]">Multi-factor verification</p>
              <p className="text-xs font-semibold text-[#68645b]">Enter an authenticator code or backup code.</p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="mfa-code" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
            Verification code
          </label>
          <input
            id="mfa-code"
            className={inputBase}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            required
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-[#e8e0c8] bg-white px-4 py-3 text-sm font-semibold text-[#68645b]">
          <input name="rememberDevice" type="checkbox" className="mt-1 size-4 accent-[#ffd400]" />
          <span>Trust this browser after successful verification.</span>
        </label>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]">
            <span className="mt-px shrink-0">!</span>
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="tb-yellow-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
          Verify and sign in
        </button>
        <button type="button" onClick={() => setChallenge(null)} className="w-full text-center text-xs font-black text-[#68645b] underline">
          Back to password login
        </button>
      </form>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3.5">
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
            placeholder="demo"
            defaultValue="demo"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
          Email address
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#68645b]"
            aria-hidden="true"
          />
          <input
            id="login-email"
            className={`${inputBase} pl-10`}
            name="email"
            placeholder="admin@taskbricks.local"
            type="email"
            required
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label htmlFor="login-password" className="block text-[13px] font-bold text-[#111111]">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs font-black text-[#111111] underline underline-offset-2">
            Forgot?
          </Link>
        </div>
        <div className="relative">
          <KeyRound
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#68645b]"
            aria-hidden="true"
          />
          <input
            id="login-password"
            className={`${inputBase} pl-10`}
            name="password"
            type="password"
            placeholder="************"
            required
          />
        </div>
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
            Signing in...
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </button>

      <div className="space-y-2 rounded-2xl border border-[#e8e0c8] bg-white/70 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#68645b]">Enterprise SSO</p>
            <p className="mt-0.5 text-xs font-semibold text-[#68645b]">Discover tenant login methods by workspace or email domain.</p>
          </div>
          <button
            type="button"
            onClick={() => void onDiscoverSso()}
            disabled={ssoLoading || loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e8e0c8] bg-white px-3 text-xs font-black text-[#111111] transition hover:border-[#ffd400] disabled:opacity-60"
          >
            {ssoLoading ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-3.5" aria-hidden="true" />}
            Find SSO
          </button>
        </div>
        {ssoRequired ? (
          <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-xs font-bold text-[#047857]">
            This workspace requires SSO. Use one of the providers below.
          </div>
        ) : null}
        {ssoProviders.length ? (
          <div className="grid gap-2">
            {ssoProviders.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => void onStartSso(provider)}
                disabled={ssoLoading || loading}
                className="flex h-10 items-center justify-between rounded-xl border border-[#e8e0c8] bg-[#111111] px-3 text-sm font-black text-white transition hover:border-[#ffd400] disabled:opacity-60"
              >
                <span>{provider.buttonLabel || `Continue with ${provider.name}`}</span>
                <ArrowRight className="size-4 text-[#ffd400]" aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="pt-1 text-center">
        <p className="text-sm font-semibold text-[#68645b]">
          New workspace?{" "}
          <Link href="/signup" className="font-black text-[#111111] underline underline-offset-2">
            Create account
          </Link>
        </p>
        <Link href="/verify-email" className="mt-2 inline-flex text-xs font-black text-[#68645b] underline underline-offset-2 hover:text-[#111111]">
          Resend verification email
        </Link>
      </div>
    </form>
  );
}
