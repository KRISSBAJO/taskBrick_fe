"use client";

import type { ComponentType, FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, CalendarCheck, CheckCircle2, Mail, MessageSquare, Phone, UserRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import { submitContactRequest, submitDemoRequest } from "@/lib/api/marketingApi";

type FormMode = "contact" | "demo";

type MarketingLeadFormProps = {
  mode: FormMode;
};

type FormState = {
  name: string;
  email: string;
  company: string;
  phone: string;
  jobTitle: string;
  teamSize: string;
  preferredDate: string;
  preferredTime: string;
  timezone: string;
  subject: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  company: "",
  phone: "",
  jobTitle: "",
  teamSize: "",
  preferredDate: "",
  preferredTime: "",
  timezone: "",
  subject: "",
  message: "",
};

const teamSizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
const controlClass =
  "w-full rounded-2xl border border-black/[0.1] bg-white px-4 py-3 text-sm font-bold text-[#111111] shadow-sm outline-none transition placeholder:text-[#aaa59a] focus:border-[#ffd400] focus:ring-4 focus:ring-[#ffd400]/15";

function fieldValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function currentPageUrl() {
  if (typeof window === "undefined") return undefined;
  return window.location.href;
}

export function MarketingLeadForm({ mode }: MarketingLeadFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isDemo = mode === "demo";
  const title = isDemo ? "Book a TaskBricks demo" : "Contact TaskBricks";
  const description = isDemo
    ? "Tell us about your team and the workflow you want to improve. We will follow up with a practical product walkthrough."
    : "Send a message to the TaskBricks team. Sales, product, and implementation questions all land in the same lead queue.";
  const buttonLabel = isDemo ? "Request demo" : "Send message";

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "";
    }
  }, []);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isDemo) {
        await submitDemoRequest({
          name: form.name,
          email: form.email,
          company: form.company,
          phone: fieldValue(form.phone),
          jobTitle: fieldValue(form.jobTitle),
          teamSize: fieldValue(form.teamSize),
          preferredDate: fieldValue(form.preferredDate),
          preferredTime: fieldValue(form.preferredTime),
          timezone: fieldValue(form.timezone) ?? timezone,
          message: fieldValue(form.message),
          source: "public-book-demo",
          pageUrl: currentPageUrl(),
        });
      } else {
        await submitContactRequest({
          name: form.name,
          email: form.email,
          company: fieldValue(form.company),
          phone: fieldValue(form.phone),
          subject: fieldValue(form.subject),
          message: form.message,
          source: "public-contact",
          pageUrl: currentPageUrl(),
        });
      }

      setSubmitted(true);
      setForm(initialState);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "We could not submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-7 shadow-[0_24px_80px_rgba(17,17,17,0.08)]">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </div>
        <h2 className="mt-6 text-2xl font-black tracking-tight text-[#111111]">
          Request received
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#4f4b43]">
          Thanks. The TaskBricks team has your details and will follow up from the configured sales inbox.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-black/[0.08] bg-white px-4 text-sm font-black text-[#111111] shadow-sm transition hover:border-[#ffd400]"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[30px] border border-black/[0.08] bg-white p-5 shadow-[0_30px_90px_rgba(17,17,17,0.08)] sm:p-7"
    >
      <div className="rounded-[24px] border border-black/[0.06] bg-[#fbfaf6] p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#ffd400] text-[#111111] shadow-[0_16px_32px_rgba(255,212,0,0.18)]">
            {isDemo ? <CalendarCheck className="size-6" aria-hidden="true" /> : <MessageSquare className="size-6" aria-hidden="true" />}
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#b28b00]">
              {isDemo ? "Demo request" : "Contact us"}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#111111]">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#68645b]">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field icon={UserRound} label="Full name" required>
          <input
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Ada Lovelace"
            className={controlClass}
          />
        </Field>

        <Field icon={Mail} label="Work email" required>
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="ada@company.com"
            className={controlClass}
          />
        </Field>

        <Field icon={Building2} label="Company" required={isDemo}>
          <input
            required={isDemo}
            value={form.company}
            onChange={(event) => updateField("company", event.target.value)}
            placeholder="Acme Delivery"
            className={controlClass}
          />
        </Field>

        <Field icon={Phone} label="Phone">
          <input
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="+1 555 0100"
            className={controlClass}
          />
        </Field>

        {isDemo ? (
          <>
            <Field icon={UserRound} label="Role">
              <input
                value={form.jobTitle}
                onChange={(event) => updateField("jobTitle", event.target.value)}
                placeholder="Head of Delivery"
                className={controlClass}
              />
            </Field>
            <Field icon={Building2} label="Team size">
              <select
                value={form.teamSize}
                onChange={(event) => updateField("teamSize", event.target.value)}
                className={controlClass}
              >
                <option value="">Select range</option>
                {teamSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </Field>
            <Field icon={CalendarCheck} label="Preferred date">
              <input
                type="date"
                value={form.preferredDate}
                onChange={(event) => updateField("preferredDate", event.target.value)}
                className={controlClass}
              />
            </Field>
            <Field icon={CalendarCheck} label="Preferred time">
              <input
                value={form.preferredTime}
                onChange={(event) => updateField("preferredTime", event.target.value)}
                placeholder="10:00 AM"
                className={controlClass}
              />
            </Field>
          </>
        ) : (
          <Field icon={MessageSquare} label="Subject" wide>
            <input
              value={form.subject}
              onChange={(event) => updateField("subject", event.target.value)}
              placeholder="How can we help?"
              className={controlClass}
            />
          </Field>
        )}

        <Field icon={MessageSquare} label={isDemo ? "What should we cover?" : "Message"} required={!isDemo} wide>
          <textarea
            required={!isDemo}
            value={form.message}
            onChange={(event) => updateField("message", event.target.value)}
            placeholder={isDemo ? "Projects, sprints, approvals, mobile workflows, AI controls..." : "Tell us what you need from TaskBricks."}
            className={`${controlClass} min-h-36 resize-none py-4`}
          />
        </Field>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-black/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold leading-5 text-[#8a8578]">
          Requests are stored securely and routed through the configured TaskBricks mail provider.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#ffd400] px-6 text-sm font-black text-[#111111] shadow-[0_16px_36px_rgba(255,212,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#f5ca00] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : buttonLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

type FieldProps = {
  children: ReactNode;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  required?: boolean;
  wide?: boolean;
};

function Field({ children, icon: Icon, label, required, wide }: FieldProps) {
  return (
    <label className={wide ? "sm:col-span-2" : undefined}>
      <span className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#68645b]">
        <Icon className="size-3.5 text-[#b28b00]" aria-hidden />
        {label}
        {required ? <span className="text-[#d22]">*</span> : null}
      </span>
      {children}
    </label>
  );
}
