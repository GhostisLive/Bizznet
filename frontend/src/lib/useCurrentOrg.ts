import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

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

const SESSION_CTX_KEY = "bizznet_org_context";

function readSessionContext(): { role: string; orgName: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CTX_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.role === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function writeSessionContext(role: string, orgName: string) {
  try {
    sessionStorage.setItem(SESSION_CTX_KEY, JSON.stringify({ role, orgName }));
  } catch {
    /* private mode: non-fatal */
  }
}

function normalizeRole(raw: string | null | undefined): string {
  const value = (raw || "manufacturer").toLowerCase().trim();
  if (value === "supplier") return "raw_material_supplier";
  return value in ROLE_LABELS ? value : "manufacturer";
}

/**
 * Resolves the signed-in organization context for every page.
 *
 * Priority order:
 *   1. Supabase session -> organizations row    (authoritative)
 *   2. Supabase user_metadata set at signup     (covers missing org row)
 *   3. ?role=&org= URL params                   (sandbox launches)
 *   4. manufacturer default
 *
 * Re-resolves whenever the URL query changes (e.g. sandbox role switches).
 */
export function useCurrentOrg(): CurrentOrg {
  const [info, setInfo] = useState<CurrentOrg>({
    role: "manufacturer",
    roleLabel: ROLE_LABELS.manufacturer,
    orgName: "Loading organization...",
    nodeId: "BIZZ-MFG-0914",
    loading: true,
    organizationId: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get("role");
      const urlOrg = params.get("org");
      const isSandbox = params.get("sandbox") === "true";

      let role: string | null = urlRole;
      let orgName: string | null = urlOrg;
      let seed = urlOrg || "sandbox";
      // organizations.id == auth.users.id, so the signed-in user's id IS
      // the organization row id used to scope all per-org data queries.
      let organizationId: string | null = null;

      if (!isSandbox) {
        try {
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            organizationId = user.id;
            seed = user.email || user.id;
            const { data: org } = await supabase
              .from("organizations")
              .select("id, name, role")
              .eq("id", user.id)
              .limit(1)
              .maybeSingle();

            if (org?.role) {
              role = org.role;
              orgName = org.name;
              seed = org.id ?? org.name;
            } else if (user.user_metadata?.role || user.user_metadata?.org_name) {
              role = role || user.user_metadata?.role || null;
              orgName = orgName || user.user_metadata?.org_name || null;
              seed = user.email || user.id;
            } else {
              seed = user.email || user.id;
            }
          }
        } catch {
          // Network/RLS hiccup: fall back to URL params silently.
        }
      }

      // In-app navigation drops query params, so persist the resolved
      // context (real or sandbox) for the rest of the tab session.
      if (!role) {
        const cached = readSessionContext();
        if (cached) {
          role = cached.role;
          orgName = orgName || cached.orgName;
        }
      }

      const normalizedRole = normalizeRole(role);
      const resolvedName =
        orgName && orgName.trim().length > 0
          ? orgName.trim()
          : `${ROLE_LABELS[normalizedRole]} (Sandbox)`;

      if (normalizedRole || urlRole) {
        writeSessionContext(normalizedRole, resolvedName);
      }

      // Derive the node id from the FINAL resolved identity so the value
      // is identical whether it came from URL, session, or the cache.
      const finalSeed = seed !== "sandbox" ? seed : resolvedName;

      if (!cancelled) {
        setInfo({
          role: normalizedRole,
          roleLabel: ROLE_LABELS[normalizedRole],
          orgName: resolvedName,
          nodeId: deriveNodeId(normalizedRole, finalSeed),
          organizationId,
          loading: false,
        });
      }
    }

    resolve();

    // Re-resolve on URL-param changes that don't remount the page
    // (sandbox role switches use router.push on the same route).
    const refresh = () => resolve();
    const onAuthChange = supabase.auth.onAuthStateChange(() => resolve());
    window.addEventListener("bizznet:session-refresh", refresh);
    window.addEventListener("popstate", refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("bizznet:session-refresh", refresh);
      window.removeEventListener("popstate", refresh);
      onAuthChange.data.subscription.unsubscribe();
    };
  }, []);

  return info;
}

/** Triggers a re-resolution of `useCurrentOrg` after programmatic redirects on the same route. */
export function broadcastSessionRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bizznet:session-refresh"));
  }
}
