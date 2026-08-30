"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = ["Platform", "Provenance", "Network", "Pricing"] as const;

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border-subtle"
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
        <a href="/" className="flex items-center gap-2 font-sans font-bold text-xl tracking-tight text-text-primary">
          <span className="block size-2 rounded-full bg-accent" />
          BizzNet
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <li key={link}>
              <a
                href={`#${link.toLowerCase()}`}
                className="relative py-1 font-sans font-medium text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-text-primary after:transition-all after:duration-200 hover:after:w-full"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-4">
          <a
            href="/login"
            className="font-sans font-medium text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign In
          </a>
          <a
            href="/signup"
            className="inline-block font-sans font-medium text-sm bg-cta-bg text-cta-text rounded-md px-5 py-2 transition-colors duration-200 hover:bg-cta-bg/90"
          >
            Register Node (Sign Up)
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="md:hidden p-2 text-text-primary"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-[max-height] duration-300 ease-in-out ${open ? "max-h-80" : "max-h-0"}`}
      >
        <div className="border-t border-border-subtle px-6 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              onClick={() => setOpen(false)}
              className="font-sans font-medium text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary"
            >
              {link}
            </a>
          ))}
          <a
            href="#request-access"
            onClick={() => setOpen(false)}
            className="inline-block text-center font-sans font-medium text-sm bg-cta-bg text-cta-text rounded-md px-5 py-2 transition-colors duration-200 hover:bg-cta-bg/90"
          >
            Request Access
          </a>
        </div>
      </div>
    </nav>
  );
}
