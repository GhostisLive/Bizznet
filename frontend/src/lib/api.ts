const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
const TOKEN_KEY = 'bizznet_access_token';

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

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  setToken(token: string) {
    this.token = token || null;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; refresh_token: string; user: any }> {
    return this.request<{ access_token: string; refresh_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(email: string, password: string, role: string = "manufacturer"): Promise<{ access_token: string; refresh_token: string; user: any }> {
    return this.request<{ access_token: string; refresh_token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
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