import Image from "next/image";
import Link from "next/link";

import { footerLinks } from "./landing-data";

export function LandingFooter() {
  return (
    <footer id="contact" className="bg-[#070707] px-5 py-16 text-white sm:px-8 lg:px-20">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-10 lg:grid-cols-[1fr_345px]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="overflow-hidden rounded-lg shadow-[0_4px_20px_rgba(255,212,0,0.18)]">
                <Image
                  src="/product/taskbrick_logo.png"
                  alt="TaskBricks"
                  width={40}
                  height={40}
                  className="block size-10 object-cover"
                />
              </span>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Task<span className="text-[#ffd400]">Bricks</span>
              </span>
            </Link>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/70">
              {footerLinks.map((item) => (
                <a key={item} href="#home" className="hover:text-[#ffd400]">
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Subscribe</p>
            <form className="mt-3 flex">
              <input className="h-10 min-w-0 flex-1 border border-white/15 bg-white/10 px-3 text-sm text-white placeholder:text-white/45" placeholder="Enter your email" type="email" />
              <button type="button" className="tb-yellow-button h-10 w-[111px] text-sm font-black">
                Subscribe
              </button>
            </form>
            <p className="mt-3 text-xs text-white/50">By subscribing you agree to with our Privacy Policy</p>
          </div>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-5 border-t border-white/10 pt-8 text-sm text-white/60 md:flex-row">
          <div className="flex flex-wrap gap-6">
            <a href="#home">Privacy Policy</a>
            <a href="#home">Terms of Service</a>
            <a href="#home">Cookies Settings</a>
          </div>
          <p>&copy; 2026 TaskBricks. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
