"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { resendVerification, setStoredAuth, verifyEmail } from "@/lib/api";

const inputBase =
  "h-12 w-full rounded-xl border border-[#e8e0c8] bg-white px-4 text-sm text-[#111111] placeholder:text-[#c0bbb2] transition-all duration-200 focus:border-[#ffd400] focus:outline-none focus:ring-2 focus:ring-[#ffd400]/15";

type NoticeTone = "error" | "success" | "warning";

type VerifyEmailPanelProps = {
  token?: string;
  initialEmail?: string;
  initialTenantSlug?: string;
  initialMessage?: string;
  initialDeliveryStatus?: string;
  initialDeliveryProvider?: string;
  initialDevLink?: string;
};

export function VerifyEmailPanel({
  token,
  initialEmail,
  initialTenantSlug,
  initialMessage,
  initialDeliveryStatus,
  initialDeliveryProvider,
  initialDevLink,
}: VerifyEmailPanelProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notice, setNotice] = useState<{ devLink?: string; message: string; tone: NoticeTone } | null>(() =>
    !token && initialMessage
      ? {
          devLink: initialDevLink,
          message: buildInitialNotice(initialMessage, initialDeliveryStatus, initialDeliveryProvider),
          tone: initialDeliveryStatus === "failed" || initialDeliveryStatus === "skipped" ? "warning" : "success",
        }
      : null
  );
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      verifyEmail({ token })
        .then((result) => {
          if (!mounted) return;
          setStoredAuth(result);
          setSuccess("Email verified. Your workspace session is ready.");
        })
        .catch((caught) => {
          if (!mounted) return;
          setError(caught instanceof Error ? caught.message : "Unable to verify email");
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }, 0);
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [token]);

  async function onResend(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setNotice(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await resendVerification({
        tenantSlug: String(formData.get("tenantSlug") ?? ""),
        email: String(formData.get("email") ?? ""),
      });
      setNotice({ devLink: result.devLink, message: result.message, tone: "success" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to resend verification email");
    } finally {
      setLoading(false);
    }
  }

  if (token) {
    return (
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-[#e8e0c8] bg-[#fffdf3] p-5">
            <Loader2 className="size-5 animate-spin text-[#111111]" aria-hidden="true" />
            <p className="mt-3 text-sm font-black text-[#111111]">Verifying email...</p>
            <p className="mt-1 text-xs font-semibold text-[#68645b]">Please keep this page open.</p>
          </div>
        ) : null}
        {error ? <Alert tone="error" message={error} /> : null}
        {success ? <Alert tone="success" message={success} /> : null}
        {success ? (
          <Link href="/dashboard" className="tb-yellow-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black">
            Continue to dashboard
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onResend} className="space-y-4">
      <div>
        <label htmlFor="tenantSlug" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
          Workspace
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#68645b]">
            @
          </span>
          <input id="tenantSlug" className={`${inputBase} pl-8`} name="tenantSlug" placeholder="demo" defaultValue={initialTenantSlug} required />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-bold text-[#111111]">
          Email address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#68645b]" aria-hidden="true" />
          <input id="email" className={`${inputBase} pl-10`} name="email" placeholder="you@company.com" type="email" defaultValue={initialEmail} required />
        </div>
      </div>
      {error ? <Alert tone="error" message={error} /> : null}
      {success ? <Alert tone="success" message={success} /> : null}
      {notice ? <Alert tone={notice.tone} message={notice.message} devLink={notice.devLink} /> : null}
      <button type="submit" disabled={loading} className="tb-yellow-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black disabled:opacity-70">
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
        Resend verification
      </button>
    </form>
  );
}

function Alert({ devLink, message, tone }: { devLink?: string; message: string; tone: NoticeTone }) {
  const success = tone === "success";
  const warning = tone === "warning";
  return (
    <div
      className={
        success
          ? "rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-semibold text-[#166534]"
          : warning
            ? "rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm font-semibold text-[#92400e]"
            : "rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#b91c1c]"
      }
    >
      <div className="flex items-start gap-2">
        {success ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <span className="mt-px shrink-0">!</span>}
        <span>{message}</span>
      </div>
      {devLink ? (
        <Link href={devLink} className="mt-2 block break-all text-xs font-black text-[#111111] underline underline-offset-2">
          Open local verification link
        </Link>
      ) : null}
    </div>
  );
}

function buildInitialNotice(message: string, deliveryStatus?: string, deliveryProvider?: string) {
  if (!deliveryStatus) return message;

  const providerLabel = deliveryProvider ? ` via ${deliveryProvider}` : "";
  if (deliveryStatus === "sent") {
    return `${message} Delivery status: sent${providerLabel}.`;
  }

  if (deliveryStatus === "skipped") {
    return `${message} Email delivery was skipped${providerLabel}. Use resend verification below after mail is configured.`;
  }

  if (deliveryStatus === "failed") {
    return `${message} Email delivery failed${providerLabel}. Use resend verification below or contact support.`;
  }

  return message;
}
