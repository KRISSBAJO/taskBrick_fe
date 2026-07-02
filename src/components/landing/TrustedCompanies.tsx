"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { logos } from "./landing-data";

export function TrustedCompanies() {
  const logoTrack = [...logos, ...logos, ...logos];

  return (
    <section className="relative overflow-hidden border-b border-black/[0.06] bg-[#f7f6ef] px-5 pb-12 pt-20">
      <div className="relative z-10 mx-auto max-w-[1240px]">
        <p className="mb-6 text-center text-[13px] font-black uppercase tracking-[0.16em] text-[#111111]">
          Trusted by ambitious teams and fast-moving companies
        </p>

        <div className="relative overflow-hidden rounded-3xl border border-[#e8e0c8] bg-white py-7 shadow-[0_18px_60px_rgba(17,17,17,0.07)]">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />

          <motion.div
            className="flex w-max items-center gap-5 px-5"
            animate={{ x: ["0%", "-33.333%"] }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          >
            {logoTrack.map((logo, index) => (
              <div
                key={`${logo.alt}-${index}`}
                className="flex h-24 min-w-[260px] items-center justify-center rounded-3xl border border-[#eee7d8] bg-[#fbfaf6] px-9 shadow-[0_12px_32px_rgba(17,17,17,0.055)] transition duration-300 hover:-translate-y-0.5 hover:border-[#d8cda8] hover:bg-white hover:shadow-[0_18px_38px_rgba(17,17,17,0.09)]"
              >
                <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} className="max-h-14 w-auto opacity-95" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
