"use client";

import Link from "next/link";
import { CalendarCheck, ArrowRight } from "lucide-react";

export function BookDemoFloatingButton() {
  return (
    <Link
      href="/book-demo"
      className="fixed bottom-4 left-4 right-4 z-50 inline-flex items-center justify-center gap-3 rounded-2xl border border-black/[0.08] bg-[#ffd400] px-4 py-3 text-sm font-black text-[#111111] shadow-[0_22px_60px_rgba(17,17,17,0.22)] transition hover:-translate-y-0.5 hover:bg-[#f5ca00] sm:bottom-5 sm:left-auto sm:right-5 sm:w-auto sm:justify-start"
      aria-label="Book a TaskBricks demo"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-[#111111] text-[#ffd400]">
        <CalendarCheck className="size-4" aria-hidden="true" />
      </span>
      Book demo
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}
