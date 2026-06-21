"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, Clock3, Loader2, Route, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import {
  createPublicBooking,
  listPublicBookingSlots,
  resolvePublicBookingPage,
  type PublicBookingCreateResponse,
  type PublicBookingPageResponse,
  type PublicBookingSlot,
} from "@/lib/api";
import { cn } from "@/lib/cn";

const slotFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function PublicBookingPage() {
  const params = useParams<{ tenantSlug: string; path?: string[] }>();
  const tenantSlug = params.tenantSlug;
  const bookingPath = (params.path ?? []).join("/");
  const [page, setPage] = useState<PublicBookingPageResponse | null>(null);
  const [slots, setSlots] = useState<PublicBookingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<PublicBookingSlot | null>(null);
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [created, setCreated] = useState<PublicBookingCreateResponse | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setMessage(null);
      try {
        const from = new Date();
        const to = new Date(from.getTime() + 14 * 24 * 60 * 60_000);
        const [pageResult, slotResult] = await Promise.all([
          resolvePublicBookingPage(tenantSlug, bookingPath),
          listPublicBookingSlots(tenantSlug, bookingPath, { from: from.toISOString(), to: to.toISOString() }),
        ]);
        if (cancelled) return;
        setPage(pageResult);
        setSlots(slotResult.slots);
        setSelectedSlot(slotResult.slots[0] ?? null);
      } catch (error) {
        if (cancelled) return;
        setMessage({ ok: false, text: error instanceof Error ? error.message : "This booking page is not available." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (tenantSlug && bookingPath) void load();
    return () => {
      cancelled = true;
    };
  }, [bookingPath, tenantSlug]);

  const groupedSlots = useMemo(() => {
    const groups = new Map<string, PublicBookingSlot[]>();
    for (const slot of slots) {
      const key = new Date(slot.startAt).toDateString();
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    }
    return [...groups.entries()].slice(0, 6);
  }, [slots]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot || !page) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    const intakeResponses = (page.page.fields ?? []).map((field) => ({
      fieldKey: field.fieldKey,
      value: String(fd.get(`field:${field.fieldKey}`) ?? "").trim(),
    }));
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await createPublicBooking(tenantSlug, {
        path: bookingPath,
        startAt: selectedSlot.startAt,
        hostId: selectedSlot.hostId,
        guestName: String(fd.get("guestName") || "").trim(),
        guestEmail: String(fd.get("guestEmail") || "").trim(),
        guestPhone: String(fd.get("guestPhone") || "").trim() || undefined,
        guestCompany: String(fd.get("guestCompany") || "").trim() || undefined,
        guestTimezone: timezone,
        notes: String(fd.get("notes") || "").trim() || undefined,
        intakeResponses,
      });
      setCreated(response);
      form.reset();
      setMessage({ ok: true, text: response.booking.status === "PENDING_APPROVAL" ? "Request submitted for approval." : "Your meeting is booked." });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Unable to complete booking." });
    } finally {
      setSubmitting(false);
    }
  }

  const accent = page?.page.brandColor || "#ffd400";

  return (
    <main className="min-h-screen bg-[#f8f7f1] text-[#111111]">
      <header className="border-b border-[#e8dfc5] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3 text-sm font-black">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#111111] text-[#ffd400]">
              <Route className="size-4" />
            </span>
            TaskBricks
          </Link>
          <span className="rounded-full border border-[#e8dfc5] bg-[#fffdf2] px-3 py-1 text-xs font-black text-[#6f685c]">
            Secure booking
          </span>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[30px] border border-[#e8dfc5] bg-[#111111] p-6 text-white shadow-[0_28px_80px_rgba(17,17,17,0.18)]">
          {loading ? (
            <div className="flex min-h-[520px] items-center justify-center gap-2 text-sm font-black text-white/70">
              <Loader2 className="size-4 animate-spin" />
              Loading booking page
            </div>
          ) : page ? (
            <>
              <div className="mb-12 flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl" style={{ background: accent, color: "#111111" }}>
                  <CalendarClock className="size-6" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">{page.tenant.name}</p>
                  <p className="text-sm font-bold text-white/70">{page.page.meetingType?.name ?? page.page.team?.name ?? "Booking page"}</p>
                </div>
              </div>
              <h1 className="max-w-xl text-5xl font-black tracking-tight md:text-6xl">{page.page.title}</h1>
              <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-white/68">
                {page.page.description || page.page.subtitle || "Pick a time that works and TaskBricks will route the meeting to the right person."}
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Fact icon={Clock3} label={`${page.page.durationMins ?? 30} mins`} />
                <Fact icon={UsersRound} label={page.page.routingStrategy.replace(/_/g, " ").toLowerCase()} />
                <Fact icon={ShieldCheck} label={page.page.approvalRequired ? "approval flow" : "instant booking"} />
              </div>
              <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2 text-sm font-black">
                  <Sparkles className="size-4" style={{ color: accent }} />
                  What happens next
                </div>
                <div className="mt-4 space-y-3 text-sm font-semibold text-white/65">
                  <p>1. Choose an available time from the routed calendar.</p>
                  <p>2. Share meeting context through the intake form.</p>
                  <p>3. Receive self-service links for cancellation or rescheduling.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[520px] items-center justify-center text-sm font-black text-white/70">Booking page unavailable.</div>
          )}
        </div>

        <div className="rounded-[30px] border border-[#e8dfc5] bg-white p-5 shadow-[0_28px_80px_rgba(17,17,17,0.08)]">
          {message ? (
            <div className={cn("mb-4 rounded-2xl border px-4 py-3 text-sm font-black", message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700")}>
              {message.text}
            </div>
          ) : null}

          {created ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
              <CheckCircle2 className="size-10 text-emerald-600" />
              <h2 className="mt-4 text-2xl font-black text-[#111111]">{created.booking.status === "PENDING_APPROVAL" ? "Request received" : "Meeting booked"}</h2>
              <p className="mt-2 text-sm font-semibold text-[#5f5b52]">
                {slotFormatter.format(new Date(created.booking.startAt))} with {created.booking.host?.firstName} {created.booking.host?.lastName}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={created.selfService.rescheduleUrl} className="rounded-2xl bg-[#111111] px-4 py-3 text-sm font-black text-white">
                  Reschedule
                </Link>
                <Link href={created.selfService.cancelUrl} className="rounded-2xl border border-[#e8dfc5] bg-white px-4 py-3 text-sm font-black text-[#111111]">
                  Cancel
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-[#111111]">Choose a time</h2>
                  <span className="text-xs font-black text-[#8b8376]">{timezone}</span>
                </div>
                <div className="mt-4 max-h-[560px] space-y-4 overflow-y-auto pr-1">
                  {groupedSlots.map(([day, daySlots]) => (
                    <div key={day}>
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#8b8376]">{day}</p>
                      <div className="grid gap-2">
                        {daySlots.slice(0, 8).map((slot) => (
                          <button
                            key={`${slot.startAt}:${slot.hostId}`}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={cn(
                              "rounded-2xl border px-4 py-3 text-left transition",
                              selectedSlot?.startAt === slot.startAt && selectedSlot.hostId === slot.hostId
                                ? "border-[#111111] bg-[#111111] text-white"
                                : "border-[#e8dfc5] bg-[#fffdf7] text-[#111111] hover:bg-[#fff7cf]",
                            )}
                          >
                            <p className="text-sm font-black">{slotFormatter.format(new Date(slot.startAt))}</p>
                            <p className={cn("mt-1 text-xs font-bold", selectedSlot?.startAt === slot.startAt ? "text-white/60" : "text-[#7c7468]")}>
                              Routed to {slot.hostName}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!loading && slots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#e8dfc5] p-6 text-center text-sm font-bold text-[#7c7468]">
                      No slots are available in the current booking window.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-[#e8dfc5] bg-[#fffdf7] p-4">
                <h2 className="text-lg font-black text-[#111111]">Your details</h2>
                <div className="mt-4 space-y-3">
                  <input name="guestName" required placeholder="Full name" className={inputClass} />
                  <input name="guestEmail" required type="email" placeholder="Email address" className={inputClass} />
                  <input name="guestPhone" placeholder="Phone or WhatsApp" className={inputClass} />
                  {page?.page.collectCompanyName ? <input name="guestCompany" placeholder="Company" className={inputClass} /> : null}
                  {(page?.page.fields ?? []).map((field) => (
                    <label key={field.id} className="block">
                      <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-[#7c7468]">
                        {field.label}{field.required ? " *" : ""}
                      </span>
                      {field.type === "LONG_TEXT" ? (
                        <textarea name={`field:${field.fieldKey}`} required={field.required} placeholder={field.placeholder ?? ""} className={`${inputClass} min-h-24 resize-none py-3`} />
                      ) : (
                        <input name={`field:${field.fieldKey}`} required={field.required} placeholder={field.placeholder ?? ""} className={inputClass} />
                      )}
                    </label>
                  ))}
                  <textarea name="notes" placeholder="Anything else we should know?" className={`${inputClass} min-h-24 resize-none py-3`} />
                  <button disabled={!selectedSlot || submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ffd400] text-sm font-black text-[#111111] shadow-[0_18px_38px_rgba(255,212,0,0.22)] disabled:opacity-60">
                    {submitting ? "Booking..." : page?.page.approvalRequired ? "Request booking" : "Book meeting"}
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function Fact({ icon: Icon, label }: { icon: typeof Clock3; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <Icon className="size-5 text-[#ffd400]" />
      <p className="mt-3 text-sm font-black capitalize text-white">{label}</p>
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border border-[#e8dfc5] bg-white px-4 text-sm font-bold text-[#111111] outline-none transition placeholder:text-[#9b9489] focus:border-[#ffd400] focus:ring-4 focus:ring-[#ffd400]/15";
