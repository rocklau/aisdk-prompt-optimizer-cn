## Product Knowledge Base

This document contains internal reference information that agents and tools can use to answer common customer questions. Content is fictional but consistent.

### Plans and Pricing

- **Free**: $0/mo
  - 5 projects, 2 seats, 10K requests/mo, community support
- **Pro**: $29/mo per workspace
  - Unlimited projects, 10 seats, 1M requests/mo, email support, rate limit: 50 rps
- **Business**: $99/mo per workspace
  - Unlimited projects, 50 seats, 20M requests/mo, priority support, SSO, rate limit: 250 rps
- **Enterprise**: Custom pricing
  - Unlimited seats, unlimited requests (fair use), dedicated support, SOC 2 Type II, custom SLAs

Billing is monthly by default; annual billing receives a 15% discount.

### Trials and Discounts

- 14‑day Pro trial available once per workspace; no credit card required.
- Educational and nonprofit discounts: 30% off Pro/Business upon approval.
- Startups under 2 years old and <$1M funding: 25% off Business for 12 months.

### Usage Limits and Overages

- Soft limits per plan listed above; overages billed at $0.20 per additional 1K requests on Pro, $0.10 on Business.
- Burst protection: short spikes up to 2× plan rps for 60 seconds are allowed.
- Hard cap toggle available in workspace settings to prevent overage charges.

### API and SDK

- Base URL: `https://api.example.com/v1`
- Auth: Bearer token via `Authorization: Bearer <token>`.
- SDKs: JS/TS official; Python in beta.
- Rate limiting: 429 returned when exceeding plan rps; retry after header is included.

#### Data Retention

- Logs retained 30 days (Free), 90 days (Pro), 365 days (Business), configurable for Enterprise.
- Opt‑out of logging available on Business and Enterprise.

### Support and SLA

- Support channels:
  - Free: community forum only
  - Pro: email support, 1 business day target response
  - Business: priority email + chat, 4 business hours target response
  - Enterprise: dedicated channel, 1 hour target response (business hours) or custom

- SLA uptime commitments:
  - Pro: 99.5% monthly
  - Business: 99.9% monthly
  - Enterprise: 99.95% monthly (customizable)

### Security and Compliance

- SOC 2 Type II (Enterprise), SOC 2 Type I (Business+).
- Data encrypted in transit (TLS 1.2+) and at rest (AES‑256).
- Regional data residency available for Enterprise (US/EU).

### Privacy

- We do not use customer data to train public models.
- DPA available upon request.
- Subprocessors list available at `https://example.com/subprocessors`.

### Refunds and Cancellations

- Month‑to‑month plans can be canceled anytime; service continues through the paid period.
- Refunds considered for service‑affecting incidents breaching SLA (credit on next invoice).
- Annual plans refundable within 30 days of initial purchase (prorated minus discount benefit).

### Terms Highlights

- Acceptable Use Policy prohibits abusive, illegal, or automated account creation.
- Fair use applies to “unlimited” features; excessive or abusive patterns may be throttled.
- Customer is responsible for safeguarding API keys.

### Feature Matrix (Selected)

| Feature | Free | Pro | Business | Enterprise |
|---|---|---|---|---|
| Custom domains | ✖️ | ✔️ | ✔️ | ✔️ |
| SSO (SAML/OIDC) | ✖️ | ✖️ | ✔️ | ✔️ |
| Data residency | ✖️ | ✖️ | ✖️ | ✔️ |
| Audit logs | ✖️ | ✔️ (30d) | ✔️ (365d) | ✔️ (custom) |

### Common Q&A

- Q: Can I pause my subscription?
  - A: Yes, Pro/Business can be paused up to 3 months; data remains read‑only.
- Q: Do sandbox keys have different limits?
  - A: Sandbox keys are throttled to 10 rps and excluded from metered billing.
- Q: How do I request deletion of logs?
  - A: Use the “Purge logs” action in workspace settings or contact support for bulk deletion.

### Internal Notes (Agent‑only)

- Upgrades take effect immediately; downgrades apply at next billing cycle.
- If a customer hits hard cap with critical workload, suggest enabling overage with alerts.
- For compliance questions, reference the latest security whitepaper (internal drive link).

### Example Responses for KB Lookup Tool

- Pricing summary: “Pro is $29/mo; Business is $99/mo; 15% off annually.”
- Refund policy: “Refunds are via service credits when SLA is breached; annual refundable within 30 days.”
- SLA: “Business 99.9% monthly uptime; Enterprise 99.95% with customization.”
- Data policy: “No training on customer data; data retention configurable on higher tiers.”


