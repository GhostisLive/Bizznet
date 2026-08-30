
# BizzNet — Product Spec (Build Scope)

## 1. Overview

BizzNet is a role-based B2B platform connecting every tier of a supply chain — raw material suppliers, manufacturers, distributors, transporters, and retailers — while attaching verified ESG provenance (self-reported / audited / third-party verified) to every material flow and listing.

## 2. Core Product Pillars

| Pillar | Description |
|---|---|
| Role-Based Network | Distributors see only relevant manufacturers & retailers by category — matched, not searched. |
| Open Marketplace | Finished-goods listings, custom-order RFQs, and byproduct/scrap trading on one exchange. |
| Structured Negotiation | Timestamped offer/counter-offer threads with a built-in "review the trace" step. |
| Provenance-Priced Data | ESG & labor-audit status is filterable, biddable, and contract-linked — not a static badge. |

## 3. User Roles

- **Raw Material Supplier**
- **Manufacturer**
- **Distributor**
- **Retailer**
- **Transporter**
- **Auditor** (third-party verification)
- **Admin** (platform operations)

## 4. Full Feature List

**Network & Identity**
- Business registration with role selection
- Product category tagging
- Role-based counterpart visibility (only relevant roles/categories shown)
- Business verification (tax ID, certifications, KYC-style checks)
- Business profile pages (history, ratings, certifications)

**Marketplace**
- Product catalog listings (specs, MOQ, price, lead time)
- Byproduct & scrap listings (volume, grade, pickup terms)
- Search and filter by category, price, MOQ, supplier, **provenance grade**
- Custom order requests (RFQs) with multi-manufacturer bidding

**Negotiation & Orders**
- Structured offer/counter-offer threads, timestamped
- Bid comparison view for RFQs
- Contract locking (accepted terms → tracked order)
- Recurring/standing order setup
- Order status tracking through to delivery

**Logistics**
- Transporter directory and booking
- Shipment tracking tied to the order record

**Traceability**
- Multi-tier supplier mapping (Tier 1-3+)
- Per-stage carbon footprint (CO₂e) per material lifecycle stage
- Data provenance tagging on every record: self-reported / audited / calculated

**Labor & Audit**
- Facility-level labor audit records
- Corrective action tracking and re-audit scheduling
- Fair wage benchmarking by region/role
- Third-party auditor submission channel

**Compliance & Reporting**
- Automated ESG/Scope 3/BRSR disclosure generation
- Compliance threshold alerts
- Document & certificate vault

**Trust & Reputation**
- Ratings and fulfillment history
- Supplier scorecards (emissions, labor record, reliability)
- Dispute resolution workflow

**Communication**
- Direct messaging between matched counterparts
- Notifications (new match, new bid, order status change, audit flag)

**Dashboards & Analytics**
- Market pricing insight per category
- ESG KPI dashboard (emissions YTD, audit coverage, waste diverted)
- Trade activity dashboard (active orders, negotiations in progress)

**Admin**
- Business onboarding review queue
- Category and taxonomy management
- Reported content / dispute moderation

## 5. MVP Scope (Build First)

**Goal:** Prove that buyers behave differently when they can see, filter, and negotiate around verified provenance data.

**In scope (single pilot vertical, 2-3 roles):**
- Business registration with role selection + category tagging
- Role-based counterpart visibility
- Marketplace listings (finished goods only) with a provenance-grade filter (manually tagged)
- Simple offer/counter-offer negotiation with manual "review the trace" step
- Manual provenance evidence upload (no live auditor API)
- Basic dashboard (listings, negotiations, activity feed)

**Explicitly deferred to v2+:**
- Compliance-conditional contracts
- Byproduct/scrap marketplace
- Multi-tier (Tier 2/3+) supplier mapping
- Automated BRSR/CSRD disclosure generation
- Auditor API integration
- Transporter booking/logistics
- Ratings, disputes, recurring orders
- Kubernetes, OpenSearch, Celery (Docker Compose + PostgreSQL full-text search covers MVP)

## 6. Data Model (Core Entities)

```
Organization → Facility → Supplier → Material → MaterialFlow
                                                       │
                                              ProvenanceRecord
                                        (self-reported / audited / verified)
```

**Extended entities for the core differentiator:**
- **ProvenanceRecord** — source type, verifying auditor, verification date, evidence reference, confidence score. Versioned/append-only, not overwritten.
- **ListingProvenanceSnapshot** — snapshots the provenance state at listing creation, so a listing's grade doesn't silently shift mid-negotiation.
- **ContractCondition** — links contract terms to provenance records (price-hold, re-audit triggers, corrective-action deadlines). Build last — v2.

## 7. Architecture

### Frontend
| Layer | Tech | Purpose |
|---|---|---|
| Framework | Next.js + React | SSR/SSG marketing site + app |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |

### Backend & Infrastructure
| Layer | Tech | Purpose |
|---|---|---|
| API / Backend | FastAPI + Python | Core business logic and APIs (modular monolith: `supply_chain`, `carbon`, `labor_audits`, `marketplace`, `provenance`, `reporting`) |
| Database | Supabase PostgreSQL | Primary relational database |
| Authentication | Supabase Auth | Login, signup, sessions, OAuth |
| Authorization | Supabase RLS | Row-level access control |
| Realtime | Supabase Realtime | Live database updates / notifications |
| File Storage | Supabase Storage | Documents, certificates, evidence vault |
| Cache | Redis | High-speed caching / temporary data |
| Background Jobs | Celery + Redis | Long-running/background processing |
| Search | Elasticsearch | Advanced/full-text search |
| API Gateway | Nginx | Reverse proxy and routing |
| Error Tracking | Sentry | Error monitoring |
| Metrics | Prometheus + Grafana | Application/infrastructure monitoring |
| Email | SendGrid / Amazon SES | Transactional emails |
| Deployment | Docker Compose (MVP) → Kubernetes (scale) | Container orchestration |

## 8. Build Sequence

1. Auth & role-based registration (thin vertical slice)
2. Provenance engine (ProvenanceRecord model + manual tagging)
3. Marketplace listings with provenance-grade filter
4. Negotiation threads with "review the trace" step
5. Basic dashboard
6. *(v2)* Byproduct marketplace, multi-tier mapping, auditor integration, compliance-conditional contracts, disclosure generation, logistics, ratings/disputes

## 9. Future Roadmap (Post-MVP)

- **Provenance confidence scoring** — ML-weighted trust score replacing a flat self-reported/audited label
- **Document auto-extraction** — parses uploaded audit certificates to auto-populate provenance records
- **AI-assisted negotiation** — suggests counter-terms based on market pricing and provenance grade
- **Smart RFQ matching** — ranks bids by capability fit, price, and provenance grade
- **Disclosure drafting** — LLM-generated narrative sections for BRSR/CSRD reports