import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Check,
  ChevronDown,
  ClipboardList,
  Diamond,
  FileText,
  FolderKanban,
  Plus,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";

import { avatars } from "./landing-data";

export function HeroSection() {
  return (
    <section id="home" className="tb-grid-surface relative mx-auto grid max-w-[1440px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_0.95fr] lg:px-16 lg:py-20">
      <div className="tb-reveal flex min-h-[560px] max-w-[690px] flex-col justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-bold text-[#111111] shadow-sm">
            <Sparkles className="size-4 text-[#e0ae00]" aria-hidden="true" />
            Your workspace, wherever work happens
          </p>
          <h1 className="mt-6 max-w-[650px] text-[42px] font-black leading-[1.08] text-black sm:text-[58px]">
            Manage work with <span className="tb-marker">speed</span> and clarity
          </h1>
          <p className="mt-7 max-w-[590px] text-lg font-medium leading-[1.75] text-[#68645b] sm:text-xl">
            Plan meetings, sprints, tasks, reports, and project delivery with the visibility and control your team needs.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <HeroStat value="30K+" label="Active users" />
            <HeroStat value="99.9%" label="Workspace uptime" />
            <div className="rounded-md border border-black/10 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm font-medium text-[#8b8b8b]">What our users say</p>
              <div className="mt-2 flex">
                {avatars.map((avatar, index) => (
                  <Image
                    key={avatar}
                    src={avatar}
                    alt=""
                    width={40}
                    height={40}
                    className="-mr-4 rounded-full border-2 border-white"
                    style={{ zIndex: avatars.length - index }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-9 flex flex-wrap gap-2">
          <Link href="/signup" className="tb-yellow-button inline-flex h-14 w-[220px] items-center justify-center rounded-md text-base font-black">
            Start Your Free Trial <ArrowRight className="ml-2 size-5" aria-hidden="true" />
          </Link>
          <a
            href="#services"
            className="inline-flex h-14 w-[152px] items-center justify-center rounded-md border border-black/15 bg-white text-base font-bold text-[#111111] shadow-sm transition hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white"
          >
            How it works
          </a>
        </div>
      </div>

      <div className="tb-reveal relative min-h-[500px] overflow-hidden rounded-md bg-transparent [animation-delay:160ms]">
        <ProductMockup />
      </div>
    </section>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border border-black/10 bg-white px-5 py-4 shadow-sm">
      <p className="text-2xl font-black text-[#111111]">{value}</p>
      <p className="mt-2 text-sm text-[#8b8b8b]">{label}</p>
    </div>
  );
}

function ProductMockup() {
  return (
    <div className="tb-dark-panel relative mx-auto h-[460px] w-full max-w-[640px] overflow-hidden rounded-md border border-white/10 p-5 shadow-[0_28px_80px_rgba(17,17,17,0.22)] lg:mt-8">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <div className="absolute left-[4%] top-6 h-[51px] w-[34%] rounded-md bg-white/95 px-4 py-3 text-black shadow-xl">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Blocks className="size-5 text-[#e0ae00]" aria-hidden="true" />
          logaXP
        </div>
      </div>
      <div className="absolute right-[4%] top-6 h-[51px] w-[66%] rounded-md bg-white/95 px-4 py-4 text-xs text-black shadow-xl">
        <span className="text-[#8b8b8b]">Workspace</span>
        <span className="mx-3 inline-block h-4 w-px align-middle bg-[#d4d4d4]" />
        <span className="font-semibold">Dashboard</span>
      </div>

      <div className="tb-card absolute left-[4%] top-[106px] w-[64%] rounded-md bg-white p-7 text-black">
        <p className="text-base font-semibold text-[rgba(6,6,6,0.51)]">Design System</p>
        <div className="mt-5 grid gap-4 text-xs text-[#8b8b8b]">
          <MockRow icon={<Users className="size-4" />} label="Assignee">
            <PillAvatar name="Max Jane" avatar="/figma/avatar-1.png" />
            <PillAvatar name="Abbie Scott" avatar="/figma/avatar-2.png" />
            <Plus className="size-3" aria-hidden="true" />
          </MockRow>
          <MockRow icon={<Tag className="size-4" />} label="Tags">
            <span className="rounded-full bg-[#fff5b8] px-3 py-1 text-black">UI Designer</span>
            <span className="text-[10px] underline">Add more</span>
          </MockRow>
          <MockRow icon={<ClipboardList className="size-4" />} label="Priority">
            <span className="rounded-full bg-[#fff1e6] px-3 py-1 text-[#ff8f37]">high priority</span>
          </MockRow>
          <MockRow icon={<FileText className="size-4" />} label="Status">
            <span className="inline-flex items-center gap-2 rounded border border-[#cfcfcf] bg-white px-3 py-1 shadow-sm">
              Review task <ChevronDown className="size-3" aria-hidden="true" />
            </span>
          </MockRow>
        </div>
      </div>

      <div className="tb-card absolute right-[4%] top-[114px] w-[34%] rounded-md bg-white p-4 text-black">
        <div className="tb-yellow-button flex h-9 items-center justify-center gap-2 rounded text-[10px] font-black">
          <Plus className="size-3" aria-hidden="true" /> Create New Project
        </div>
        <div className="mt-4 flex h-9 items-center gap-2 rounded bg-[#f3f0df] px-4 text-[10px] font-medium">
          <FolderKanban className="size-3" aria-hidden="true" /> Dashboard
        </div>
        <div className="mt-5 px-4 text-[10px] text-[#8b8b8b]">
          <div className="flex items-center gap-2">
            <Diamond className="size-3" aria-hidden="true" /> Projects
          </div>
          <div className="mt-4 grid gap-3 pl-4">
            {["Ecommerce Website Design", "Bard logo Design", "logaXP Branding", "Case Study"].map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                <span className="flex size-3 items-center justify-center border border-[#8b8b8b]">
                  {index < 2 ? <Check className="size-2" aria-hidden="true" /> : null}
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tb-card absolute bottom-5 left-[14%] w-[270px] rounded-md bg-white text-black">
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-[#fff5b8] text-black">
              <FolderKanban className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] text-[#8b8b8b]">Ongoing Project</p>
              <p className="text-[10px] font-semibold">126 Projects</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#0d9d00]">+30%</p>
            <p className="text-[10px] text-[#8b8b8b]">Last month</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[#d4d4d4] px-4 py-3">
          <div className="flex">
            {avatars.slice(0, 3).map((avatar) => (
              <Image key={avatar} src={avatar} alt="" width={22} height={22} className="-mr-2 rounded-full border border-white" />
            ))}
          </div>
          <span className="inline-flex items-center gap-2 text-[10px] text-[#8b8b8b]">
            View Details <ArrowRight className="size-3" aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  );
}

function MockRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[74px_1fr] items-center gap-5">
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function PillAvatar({ avatar, name }: { avatar: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3">
      <Image src={avatar} alt="" width={18} height={18} className="rounded-full" />
      {name}
    </span>
  );
}
