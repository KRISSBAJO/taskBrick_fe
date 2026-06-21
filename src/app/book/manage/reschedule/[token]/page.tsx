"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CalendarClock, CheckCircle2, Loader2 } from "lucide-react";
import { reschedulePublicBooking } from "@/lib/api";
import { cn } from "@/lib/cn";

export default function RescheduleBookingPage() {
  const params = useParams<{ token: string }>();
  const [defaultTime, setDefaultTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const base = new Date();
      base.setDate(base.getDate() + 2);
      base.setHours(10, 0, 0, 0);
      setDefaultTime(toDateTimeInput(base));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const startAt = String(fd.get("startAt") || "");
    setLoading(true);
    setMessage(null);
    try {
      await reschedulePublicBooking(params.token, { startAt: new Date(startAt).toISOString() });
      setMessage({ ok: true, text: "Your booking has been rescheduled." });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Unable to reschedule this booking." });
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
        <div className="mt-8 flex size-14 items-center justify-center rounded-2xl bg-[#fff7cf] text-[#111111]">
          {message?.ok ? <CheckCircle2 className="size-7 text-emerald-600" /> : <CalendarClock className="size-7" />}
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight">Reschedule booking</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#6f685c]">Choose a new time. TaskBricks will re-check host availability, buffers, booking limits, and blackout windows.</p>
        {message ? (
          <div className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm font-black", message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700")}>
            {message.text}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <input name="startAt" type="datetime-local" required defaultValue={defaultTime} className={inputClass} />
            <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ffd400] text-sm font-black text-[#111111] disabled:opacity-60">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Reschedule booking
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function toDateTimeInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

const inputClass =
  "h-12 w-full rounded-2xl border border-[#e8dfc5] bg-white px-4 text-sm font-bold text-[#111111] outline-none transition placeholder:text-[#9b9489] focus:border-[#ffd400] focus:ring-4 focus:ring-[#ffd400]/15";
