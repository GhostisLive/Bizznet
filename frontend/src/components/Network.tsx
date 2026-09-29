"use client";

import { Factory, Truck, Store, Pickaxe, Package } from "lucide-react";

const roles = [
  {
    icon: Pickaxe,
    name: "Raw Material Supplier",
    sees: ["Manufacturer"],
    description: "Supplies raw inputs — metals, fibers, chemicals, timber.",
  },
  {
    icon: Factory,
    name: "Manufacturer",
    sees: ["Raw Material Supplier", "Distributor", "Retailer"],
    description:
      "Transforms raw materials into finished goods. Sees suppliers upstream and buyers downstream.",
  },
  {
    icon: Package,
    name: "Distributor",
    sees: ["Manufacturer", "Retailer"],
    description:
      "Moves finished goods from factory to market. Matched to manufacturers and retailers by category.",
  },
  {
    icon: Truck,
    name: "Transporter",
    sees: ["All roles"],
    description:
      "Handles logistics and shipment. Visible across the network for booking.",
  },
  {
    icon: Store,
    name: "Retailer",
    sees: ["Manufacturer", "Distributor"],
    description:
      "Sells to end consumers. Filters upstream suppliers by provenance grade to meet compliance.",
  },
];

export default function Network() {
  return (
    <section id="network" className="bg-white py-24 border-b border-[#E8E0D4]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-semibold text-[#6B5B3E] uppercase tracking-wider">Network Architecture</span>
          <h2 className="text-3xl font-bold tracking-tight text-[#2C2418] md:text-4xl">
            You see who matters. Nothing else.
          </h2>
          <p className="mt-2 max-w-2xl text-lg text-[#5C5040]">
            BizzNet matches counterparts by role and product category. A distributor of automotive parts never sees a textile retailer. Every connection is relevant.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-5">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.name}
                className="bg-white border border-[#E8E0D4] rounded-xl p-6 flex flex-col shadow-xs hover:border-[#6B5B3E]/40 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F0E8] text-[#6B5B3E]">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[#2C2418]">
                  {role.name}
                </h3>
                <p className="mt-2 text-xs text-[#5C5040] leading-relaxed flex-1">
                  {role.description}
                </p>
                <div className="mt-4 border-t border-[#E8E0D4] pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#A89B8A]">
                    Matched with
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {role.sees.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-[#FAF8F5] px-2 py-0.5 font-mono text-[11px] text-[#5C5040] border border-[#E8E0D4]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
