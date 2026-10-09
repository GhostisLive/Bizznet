const CONFIGURED_API_BASE = process.env.NEXT_PUBLIC_API_URL;

function getApiBase(): string {
  if (typeof window !== "undefined") {
    if (CONFIGURED_API_BASE) {
      try {
        const configured = new URL(CONFIGURED_API_BASE);
        const browserHost = window.location.hostname;
        const browserIsLocal =
          browserHost === "localhost" ||
          browserHost === "127.0.0.1" ||
          browserHost === "::1";
        const configuredIsLocal =
          configured.hostname === "localhost" ||
          configured.hostname === "127.0.0.1" ||
          configured.hostname === "::1";

        // A frontend build often contains localhost from the developer's
        // machine. Replace only that loopback host when another client opens
        // the app over the LAN; keep an explicitly configured remote API host.
        if (!browserIsLocal && configuredIsLocal) {
          configured.hostname = browserHost;
        }
        return configured.toString().replace(/\/+$/, "");
      } catch {
        // Fall through to the browser-derived URL for an invalid build value.
      }
    }
    return "/api/backend/api/v1";
  }
  if (CONFIGURED_API_BASE) return CONFIGURED_API_BASE.replace(/\/+$/, "");
  return "/api/backend/api/v1";
}

export const API_BASE = getApiBase();
const TOKEN_KEY = 'bizznet_access_token';
const REFRESH_KEY = 'bizznet_refresh_token';

/** Endpoints that must never trigger a token refresh (avoids recursion). */
const NO_REFRESH_ENDPOINTS = ['/auth/login', '/auth/signup', '/auth/refresh'];

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/** Duck-typed so it works even if the module is instantiated twice. */
export function isAuthError(error: unknown): error is AuthError {
  return (
    error instanceof Error &&
    (error.name === 'AuthError' ||
      (typeof (error as AuthError).status === 'number' &&
        (error as AuthError).status === 401))
  );
}

export interface MarketplaceListing {
  id: string;
  organization_id: string;
  facility_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  moq: number;
  unit: string;
  status: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  tax_id: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Facility {
  id: string;
  organization_id: string;
  name: string;
  location: Record<string, any> | null;
  carbon_intensity_factor: number;
  created_at: string;
}

export interface ProvenanceRecord {
  id: string;
  organization_id: string;
  type: string;
  verifying_party: string | null;
  evidence_url: string | null;
  verified_at: string | null;
  expiration_date: string | null;
  payload: Record<string, any> | null;
  created_at: string;
}

export interface Negotiation {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  status: string;
  provenance_reviewed: boolean;
  created_at: string;
}

export interface AuditorCompany {
  id: string;
  name: string;
  role: string;
  status: string;
}

export interface Auditor {
  id: string;
  name: string;
  role: string;
  status: string;
}

export interface AuditRequest {
  id: string;
  auditor_id: string;
  company_id: string;
  company: AuditorCompany;
  audit_type: 'company' | 'labour' | 'carbon';
  status: string;
  scope_note: string | null;
  requested_at: string;
  due_at: string | null;
}

export interface AuditLog {
  id: string;
  request_id: string | null;
  company_id: string;
  company: AuditorCompany;
  audit_type: 'company' | 'labour' | 'carbon';
  score: number | null;
  findings: string | null;
  recommendations: string | null;
  completed_at: string | null;
  digital_contract_id: string | null;
}

export interface Certification {
  id: string;
  auditor_id: string;
  company_id: string;
  company: AuditorCompany;
  audit_type: 'company' | 'labour' | 'carbon';
  certificate_number: string;
  score: number | null;
  issued_at: string;
  expires_at: string | null;
  status: string;
}

export interface NegotiationDocument {
  id: string;
  negotiation_id: string;
  document_type: string;
  document_number: string;
  title: string;
  content_markdown: string;
  terms_snapshot: Record<string, unknown>;
  generation_source: 'ollama' | 'template';
  ai_model: string | null;
  generation_error: string | null;
  created_at: string;
}

export interface AuditorMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface NegotiationBid {
  id: string;
  negotiation_id: string;
  sender_id: string;
  price: number;
  moq: number;
  provenance_requirement: string | null;
  terms: string | null;
  timestamp: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshTokenValue: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private lastRefreshAttempt = 0;

  constructor(baseUrl: string = getApiBase()) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY);
      this.refreshTokenValue = localStorage.getItem(REFRESH_KEY);
    }
  }

  setToken(token: string) {
    this.token = token || null;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        this.refreshTokenValue = null;
      }
    }
  }

  setRefreshToken(token: string) {
    this.refreshTokenValue = token || null;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem(REFRESH_KEY, token);
      } else {
        localStorage.removeItem(REFRESH_KEY);
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  hasSession(): boolean {
    return Boolean(this.token || this.refreshTokenValue);
  }

  /** Exchange the stored refresh token for a fresh access token (single-flight). */
  private async refreshTokens(): Promise<boolean> {
    if (!this.refreshTokenValue) return false;
    // Cooldown after a failed refresh so a dead backend isn't hammered.
    if (Date.now() - this.lastRefreshAttempt < 5000 && !this.refreshPromise) {
      return false;
    }
    if (!this.refreshPromise) {
      const refresh = async () => {
        this.lastRefreshAttempt = Date.now();
        try {
          const res = await fetch(
            `${this.baseUrl}/auth/refresh?refresh_token=${encodeURIComponent(this.refreshTokenValue!)}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' } },
          );
          if (!res.ok) return false;
          const data = await res.json();
          if (!data?.access_token) return false;
          this.token = data.access_token;
          if (typeof window !== "undefined") {
            localStorage.setItem(TOKEN_KEY, data.access_token);
          }
          if (data.refresh_token) this.setRefreshToken(data.refresh_token);
          return true;
        } catch {
          return false;
        } finally {
          this.refreshPromise = null;
        }
      };
      this.refreshPromise = refresh();
    }
    return this.refreshPromise;
  }

  private buildHeaders(options: RequestInit): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const canRefresh =
      !NO_REFRESH_ENDPOINTS.some((e) => endpoint.startsWith(e)) &&
      Boolean(this.refreshTokenValue);

    // Refresh token but no access token: mint one before the first call so the
    // request never goes out unauthenticated (FastAPI answers 401 "Not authenticated").
    if (!this.token && canRefresh) {
      await this.refreshTokens();
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: this.buildHeaders(options),
      });
    } catch {
      throw new Error(
        `Unable to reach the BizzNet API at ${this.baseUrl}. Check that the backend is running and accessible from this client.`,
      );
    }

    // Expired access token: refresh once, then retry the original request.
    if (response.status === 401 && canRefresh && (await this.refreshTokens())) {
      try {
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: this.buildHeaders(options),
        });
      } catch {
        throw new Error(
          `Unable to reach the BizzNet API at ${this.baseUrl}. Check that the backend is running and accessible from this client.`,
        );
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      const message = error.detail || `HTTP ${response.status}`;
      if (response.status === 401) {
        // Refresh failed or no refresh token: the session is gone.
        this.setToken('');
        throw new AuthError(message, 401);
      }
      throw new Error(message);
    }

    return response.json();
  }

  async downloadAgreementPdf(negotiationId: string): Promise<Blob> {
    const endpoint = `/negotiation/${negotiationId}/document/pdf`;
    const canRefresh = Boolean(this.refreshTokenValue);
    if (!this.token && canRefresh) {
      await this.refreshTokens();
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: this.buildHeaders({}),
      });
    } catch {
      throw new Error(
        `Unable to reach the BizzNet API at ${this.baseUrl}. Check that the backend is running and accessible from this client.`,
      );
    }

    if (response.status === 401 && canRefresh && (await this.refreshTokens())) {
      try {
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: this.buildHeaders({}),
        });
      } catch {
        throw new Error(
          `Unable to reach the BizzNet API at ${this.baseUrl}. Check that the backend is running and accessible from this client.`,
        );
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      if (response.status === 401) {
        this.setToken('');
        throw new AuthError(error.detail || 'Authentication required', 401);
      }
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.blob();
  }

  async regenerateAgreement(negotiationId: string): Promise<NegotiationDocument> {
    return this.request(`/negotiation/${negotiationId}/document/regenerate`, {
      method: "POST",
    });
  }

  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; refresh_token: string; user: any }> {
    const data = await this.request<{ access_token: string; refresh_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.refresh_token) this.setRefreshToken(data.refresh_token);
    return data;
  }

  async signup(email: string, password: string, role: string = "manufacturer"): Promise<{ access_token: string; refresh_token: string; user: any }> {
    const data = await this.request<{ access_token: string; refresh_token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    if (data.refresh_token) this.setRefreshToken(data.refresh_token);
    return data;
  }

  async getCurrentUserInfo(): Promise<{ id: string; email: string; role: string; organization_id: string }> {
    return this.request<{ id: string; email: string; role: string; organization_id: string }>('/auth/me');
  }

  async getOrganizationById(orgId: string): Promise<{ id: string; name: string; role: string; tax_id: string | null; status: string; created_at: string; updated_at: string }> {
    return this.request<{ id: string; name: string; role: string; tax_id: string | null; status: string; created_at: string; updated_at: string }>(`/network/${orgId}`);
  }

  // Marketplace
  async getListings(filters?: {
    category?: string;
    min_price?: number;
    max_price?: number;
    max_moq?: number;
    provenance_grade?: string;
  }): Promise<MarketplaceListing[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 'all') {
          params.append(key, String(value));
        }
      });
    }
    return this.request<MarketplaceListing[]>(`/marketplace/listings?${params.toString()}`);
  }

  async getListing(listingId: string): Promise<MarketplaceListing> {
    return this.request<MarketplaceListing>(`/marketplace/listings/${listingId}`);
  }

  // Network
  async getCounterparts(): Promise<Organization[]> {
    return this.request<Organization[]>('/network/counterparts');
  }

  // Provenance
  async getProvenanceRecords(): Promise<ProvenanceRecord[]> {
    return this.request<ProvenanceRecord[]>('/provenance/records');
  }

  // Negotiations
  async getNegotiations(): Promise<Negotiation[]> {
    return this.request<Negotiation[]>('/negotiation/negotiations');
  }

  async getAuditorCompanies(): Promise<AuditorCompany[]> {
    return this.request<AuditorCompany[]>('/auditor/companies');
  }

  async getAuditors(): Promise<Auditor[]> {
    return this.request<Auditor[]>('/auditor/auditors');
  }

  async getCompanyAuditRequests(): Promise<AuditRequest[]> {
    return this.request<AuditRequest[]>('/auditor/company-requests');
  }

  async requestCompanyAudit(input: { auditor_id: string; audit_type: AuditRequest['audit_type']; scope_note?: string; due_at?: string }): Promise<AuditRequest> {
    return this.request('/auditor/company-requests', { method: 'POST', body: JSON.stringify(input) });
  }

  async getAuditorOverview(): Promise<{ open_requests: number; completed_audits: number; active_certifications: number; average_score: number | null }> {
    return this.request('/auditor/overview');
  }

  async getAuditRequests(): Promise<AuditRequest[]> {
    return this.request('/auditor/audit-requests');
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return this.request('/auditor/audit-logs');
  }

  async getCertifications(): Promise<Certification[]> {
    return this.request('/auditor/certifications');
  }

  async getCompanyCertifications(): Promise<Certification[]> {
    return this.request('/auditor/company-certifications');
  }

  async createCertification(input: { company_id: string; audit_type: Certification['audit_type']; score?: number; expires_at?: string }): Promise<Certification> {
    return this.request('/auditor/certifications', { method: 'POST', body: JSON.stringify(input) });
  }

  async createAuditRequest(input: { company_id: string; audit_type: AuditRequest['audit_type']; scope_note?: string; due_at?: string }): Promise<AuditRequest> {
    return this.request('/auditor/audit-requests', { method: 'POST', body: JSON.stringify(input) });
  }

  async createCompanyAuditRequest(input: { auditor_id: string; audit_type: 'company' | 'labour' | 'carbon'; scope_note?: string; due_at?: string }): Promise<AuditRequest> {
    return this.request('/auditor/company-requests', { method: 'POST', body: JSON.stringify(input) });
  }

  async updateAuditRequest(requestId: string, input: { status: 'pending' | 'in_progress' | 'completed' }): Promise<AuditRequest> {
    return this.request(`/auditor/audit-requests/${requestId}`, { method: 'PATCH', body: JSON.stringify(input) });
  }

  async completeAudit(input: { request_id: string; score: number; findings: string; recommendations?: string; expires_at?: string }): Promise<{ audit_log: AuditLog; certification: Certification }> {
    return this.request(`/auditor/audit-requests/${input.request_id}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        score: input.score,
        findings: input.findings,
        recommendations: input.recommendations,
        expires_at: input.expires_at,
      }),
    });
  }

  async getAuditorMessages(companyId: string): Promise<AuditorMessage[]> {
    return this.request(`/auditor/conversations/${companyId}/messages`);
  }

  async sendAuditorMessage(companyId: string, content: string): Promise<AuditorMessage> {
    return this.request(`/auditor/conversations/${companyId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
}

export const api = new ApiClient();

export async function getListings(filters?: {
  category?: string;
  min_price?: number;
  max_price?: number;
  max_moq?: number;
  provenance_grade?: string;
}): Promise<MarketplaceListing[]> {
  return api.getListings(filters);
}

export async function getCounterparts(): Promise<Organization[]> {
  return api.getCounterparts();
}

export async function getProvenanceRecords(): Promise<ProvenanceRecord[]> {
  return api.getProvenanceRecords();
}

export async function getNegotiations(): Promise<Negotiation[]> {
  return api.getNegotiations();
}