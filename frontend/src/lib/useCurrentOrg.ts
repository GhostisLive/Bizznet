import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthProvider";

export interface CurrentOrg {
  role: string;
  roleLabel: string;
  orgName: string;
  nodeId: string;
  loading: boolean;
  organizationId: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  raw_material_supplier: "Raw Material Supplier",
  manufacturer: "Manufacturer & Component Assembler",
  distributor: "Distributor & Warehouse Operator",
  retailer: "Retailer & Brand Outlet",
  transporter: "Logistics & Transporter Carrier",
  auditor: "Third-Party Auditor",
  admin: "Platform Administrator",
};

const ROLE_PREFIXES: Record<string, string> = {
  raw_material_supplier: "SUP",
  manufacturer: "MFG",
  distributor: "DST",
  retailer: "RET",
  transporter: "TRN",
  auditor: "AUD",
  admin: "ADM",
};

/** Stable 4-digit node suffix derived from an org name/id string. */
function deriveNodeId(role: string, seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 10000;
  }
  const prefix = ROLE_PREFIXES[role] ?? "ORG";
  return `BIZZ-${prefix}-${String(hash).padStart(4, "0")}`;
}

/**
 * Resolves the signed-in organization context for every page.
 *
 * Priority order:
 *   1. Backend session -> organizations row    (authoritative)
 *   2. manufacturer default
 *
 * Re-resolves whenever the auth state changes.
 */
export function useCurrentOrg(): CurrentOrg {
  const { user, org, loading } = useAuth();
  const [info, setInfo] = useState<CurrentOrg>({
    role: "manufacturer",
    roleLabel: ROLE_LABELS.manufacturer,
    orgName: "Loading organization...",
    nodeId: "BIZZ-MFG-0914",
    loading: true,
    organizationId: null,
  });

  useEffect(() => {
    if (loading) {
      setInfo(prev => ({ ...prev, loading: true }));
      return;
    }

    if (!user) {
      // Guest/default case
      setInfo({
        role: "manufacturer",
        roleLabel: ROLE_LABELS.manufacturer,
        orgName: "Guest Organization",
        nodeId: "BIZZ-MFG-0000",
        loading: false,
        organizationId: null,
      });
      return;
    }

    if (!org) {
      // User logged in but organization not yet loaded (shouldn't happen in normal flow)
      setInfo({
        role: "manufacturer", // fallback from user metadata or default
        roleLabel: ROLE_LABELS.manufacturer,
        orgName: user.email?.split('@')[0] || "Unknown Organization",
        nodeId: "BIZZ-MFG-0000",
        loading: false,
        organizationId: user.id,
      });
      return;
    }

      // Normal case: user and org are available
      setInfo({
        role: org.role,
        roleLabel: ROLE_LABELS[org.role],
        orgName: org.name,
        nodeId: deriveNodeId(org.role, org.id),
        loading: false,
        organizationId: org.id,
      });
  }, [user, org, loading]);

  return info;
}

/** Triggers a re-resolution of `useCurrentOrg` after programmatic redirects on the same route. */
export function broadcastSessionRefresh() {
  // This is now handled by the AuthProvider's session refresh mechanism
  // We can trigger a refresh by updating the AuthProvider's state if needed
  // For now, we'll keep this as a no-op since the AuthProvider handles it
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bizznet:session-refresh"));
  }
}
