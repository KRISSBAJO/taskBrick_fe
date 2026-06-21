"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { completeSso, setStoredAuth } from "@/lib/api";

export default function SsoCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell state="loading" message="Completing SSO sign in..." />}>
      <SsoCallbackContent />
    </Suspense>
  );
}

function SsoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      const providerError = searchParams.get("error");
      const state = searchParams.get("state");
      const code = searchParams.get("code");

      if (providerError) {
        setError(searchParams.get("error_description") || providerError);
        return;
      }

      if (!state || !code) {
        setError("SSO callback is missing state or authorization code.");
        return;
      }

      void completeSso({ state, code })
        .then((auth) => {
          if (cancelled) return;
          setStoredAuth(auth);
          router.replace("/dashboard");
        })
        .catch((caught) => {
          if (!cancelled) setError(caught instanceof Error ? caught.message : "Unable to complete SSO sign in.");
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [router, searchParams]);

  if (error) {
    return <CallbackShell state="error" message={error} />;
  }

  return <CallbackShell state="loading" message="Completing SSO sign in..." />;
}

function CallbackShell({ message, state }: { message: string; state: "loading" | "error" }) {
  const isError = state === "error";
  return (
    <main className="min-h-screen bg-[#fbf8ed] px-4 py-10 text-[#111111]">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center">
        <div className="w-full rounded-3xl border border-[#e8e0c8] bg-white p-6 text-center shadow-[0_24px_80px_rgba(17,17,17,0.12)]">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#111111] text-[#ffd400]">
            {isError ? <TriangleAlert className="size-6" aria-hidden="true" /> : <ShieldCheck className="size-6" aria-hidden="true" />}
          </span>
          <h1 className="mt-5 text-2xl font-black">{isError ? "SSO sign in failed" : "Securing your session"}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#68645b]">{message}</p>
          {isError ? (
            <Link href="/login" className="tb-yellow-button mt-5 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-black">
              Back to login
            </Link>
          ) : (
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#e8e0c8] bg-[#fbf8ed] px-4 py-2 text-sm font-black">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Please wait
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
