"use client";

import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";

const links = ["Platform", "Provenance", "Network", "Pricing"] as const;

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E8E0D4] shadow-xs"
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
        <a href="/" className="flex items-center gap-2.5 font-sans font-bold text-xl tracking-tight text-[#2C2418]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6B5B3E] text-white shadow-xs">
            <ShieldCheck size={18} />
          </div>
          <span>Bizz<span className="text-[#6B5B3E]">Net</span></span>
        </a>

        <ul className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <li key={link}>
              <a
                href={`#${link.toLowerCase()}`}
                className="px-4 py-2 rounded-md font-sans font-medium text-sm text-[#5C5040] transition-colors duration-200 hover:text-[#2C2418] hover:bg-[#FAF8F5]"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="font-sans font-medium text-sm text-[#5C5040] hover:text-[#2C2418] transition-colors px-4 py-2"
          >
            Sign In
          </a>
          <a
            href="/dashboard?role=manufacturer"
            className="inline-flex items-center gap-2 font-sans font-semibold text-sm bg-[#2C2418] hover:bg-[#4E4433] text-white rounded-lg px-5 py-2.5 transition-all shadow-xs"
          >
            View Dashboard
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="md:hidden p-2 rounded-lg text-[#2C2418] hover:bg-[#FAF8F5] transition-colors"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-[max-height] duration-300 ease-in-out ${open ? "max-h-80" : "max-h-0"}`}
      >
        <div className="border-t border-[#E8E0D4] px-6 py-4 flex flex-col gap-1 bg-white">
          {links.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              onClick={() => setOpen(false)}
              className="font-sans font-medium text-sm text-[#5C5040] px-3 py-2.5 rounded-lg transition-colors duration-200 hover:text-[#2C2418] hover:bg-[#FAF8F5]"
            >
              {link}
            </a>
          ))}
          <a
            href="/dashboard?role=manufacturer"
            onClick={() => setOpen(false)}
            className="mt-2 inline-block text-center font-sans font-semibold text-sm bg-[#2C2418] text-white rounded-lg px-5 py-2.5 transition-all"
          >
            View Dashboard
          </a>
        </div>
      </div>
    </nav>
  );
}
