"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CalendarX2, CheckCircle2, Loader2 } from "lucide-react";
import { cancelPublicBooking } from "@/lib/api";
import { cn } from "@/lib/cn";

export default function CancelBookingPage() {
  const params = useParams<{ token: string }>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    setLoading(true);
    setMessage(null);
    try {
      await cancelPublicBooking(params.token, { reason: String(fd.get("reason") || "").trim() || undefined });
      setMessage({ ok: true, text: "Your booking has been cancelled." });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Unable to cancel this booking." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f7f1] px-5 py-10 text-[#111111]">
      <section className="mx-auto max-w-xl rounded-[30px] border border-[#e8dfc5] bg-white p-6 shadow-[0_28px_80px_rgba(17,17,17,0.08)]">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-[#6f685c]">
          <ArrowLeft className="size-4" />
          TaskBricks
        </Link>
        <div className="mt-8 flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          {message?.ok ? <CheckCircle2 className="size-7" /> : <CalendarX2 className="size-7" />}
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight">Cancel booking</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#6f685c]">Use this secure link to cancel your meeting. The host will see the cancellation in TaskBricks.</p>
        {message ? (
          <div className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm font-black", message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700")}>
            {message.text}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <textarea name="reason" placeholder="Reason for cancellation, optional" className={`${inputClass} min-h-28 resize-none py-3`} />
            <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#111111] text-sm font-black text-white disabled:opacity-60">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Cancel booking
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border border-[#e8dfc5] bg-white px-4 text-sm font-bold text-[#111111] outline-none transition placeholder:text-[#9b9489] focus:border-[#ffd400] focus:ring-4 focus:ring-[#ffd400]/15";
