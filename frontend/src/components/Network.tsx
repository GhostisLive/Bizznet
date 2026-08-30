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
    <section id="network" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
          You see who matters. Nothing else.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-text-secondary">
          BizzNet matches counterparts by role and product category. A
          distributor of automotive parts never sees a textile retailer. Every
          connection is relevant.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-px bg-border-subtle md:grid-cols-5 rounded-lg overflow-hidden border border-border-subtle">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.name}
                className="bg-surface-elevated p-6 flex flex-col"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface">
                  <Icon size={20} className="text-text-primary" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-text-primary">
                  {role.name}
                </h3>
                <p className="mt-2 text-xs text-text-secondary leading-relaxed flex-1">
                  {role.description}
                </p>
                <div className="mt-4 border-t border-border-subtle pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                    Matched with
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {role.sees.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-surface px-2 py-0.5 font-mono text-[11px] text-text-secondary"
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
