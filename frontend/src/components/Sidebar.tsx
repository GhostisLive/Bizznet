"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Handshake,
  UserCheck,
  Building2,
  Leaf,
  User,
  ShieldCheck,
  Menu,
  X,
  RefreshCw
} from "lucide-react";

interface SidebarProps {
  currentRole?: string;
  orgName?: string;
}

export default function Sidebar({
  currentRole = "Manufacturer",
  orgName = "Manufacturer Alpha"
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Marketplace", href: "/marketplace", icon: Store },
    { label: "Negotiations", href: "/negotiations", icon: Handshake, badge: "14" },
    { label: "Labour Audit", href: "/labour-audit", icon: UserCheck },
    { label: "Company Audit", href: "/company-audit", icon: Building2 },
    { label: "Carbon Audit", href: "/carbon-audit", icon: Leaf },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <>
      {/* Mobile Top Navigation Header with Menu Toggle */}
      <div className="lg:hidden bg-[#2C2418] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-[#4E4433]">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-sans font-bold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6B5B3E] text-white">
            <ShieldCheck size={20} />
          </div>
          <span>Bizz<span className="text-[#7D6B4D]">Net</span></span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-white hover:bg-[#4E4433]"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#2C2418] text-white px-6 py-4 border-b border-[#4E4433] space-y-2 sticky top-[65px] z-40">
          <div className="pb-3 border-b border-[#4E4433] mb-2">
            <p className="text-xs font-mono text-[#A89B8A] uppercase font-bold">{orgName}</p>
            <p className="text-sm font-bold text-[#7D6B4D]">{currentRole}</p>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${
                  active
                    ? "bg-[#6B5B3E] text-white shadow-md"
                    : "text-[#A89B8A] hover:text-white hover:bg-[#4E4433]"
                }`}
              >
                <Icon size={22} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#2E7D5B] text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop Persistent Sleek Dark-Slate Vertical Sidebar */}
      <aside className="hidden lg:flex w-72 bg-[#2C2418] text-white flex-col justify-between shrink-0 p-6 shadow-xl border-r border-[#4E4433] min-h-screen sticky top-0 h-screen">
        <div className="space-y-8">
          
          {/* Brand Header */}
          <Link href="/dashboard" className="flex items-center gap-3 pb-6 border-b border-[#4E4433] group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6B5B3E] text-white shadow-md group-hover:scale-105 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl text-white tracking-tight leading-none">
                Bizz<span className="text-[#7D6B4D]">Net</span>
              </h1>
              <p className="text-xs font-mono text-[#A89B8A] mt-1 uppercase tracking-wider font-bold">
                Enterprise Node
              </p>
            </div>
          </Link>

          {/* Organization Profile Badge */}
          <div className="p-4 rounded-xl bg-[#4E4433] border border-[#5C5040]/60 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-[#A89B8A] tracking-wider">Node Active</span>
              <span className="size-2.5 rounded-full bg-[#2E7D5B] animate-pulse" />
            </div>
            <p className="text-base font-extrabold text-white mt-1 truncate">{orgName}</p>
            <p className="text-xs font-mono text-[#7D6B4D] font-bold mt-0.5">{currentRole}</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-base font-bold transition-all ${
                    active
                      ? "bg-[#6B5B3E] text-white shadow-lg shadow-[#6B5B3E]/25"
                      : "text-[#A89B8A] hover:text-white hover:bg-[#4E4433]"
                  }`}
                >
                  <Icon size={22} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#2E7D5B] text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Node Info */}
        <div className="pt-6 border-t border-[#4E4433] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#A89B8A]">
            <span>Ledger Status</span>
            <span className="font-bold text-[#2E7D5B]">SYNCED</span>
          </div>
          <div className="p-3 rounded-lg bg-[#4E4433] text-xs font-mono text-[#A89B8A]">
            Node Key: <strong className="text-white font-bold">BIZZ-MFG-0914</strong>
          </div>
        </div>
      </aside>
    </>
  );
}
