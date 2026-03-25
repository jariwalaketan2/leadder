# HVAC Quote System

An embeddable HVAC quoting widget + business portal built with Next.js and Supabase.

**Live:** [https://leadder-ochre.vercel.app](https://leadder-ochre.vercel.app)

---

## What it does

- **Widget** — Guided HVAC selection wizard embedded on any business's site via `/<business-slug>`
  - HVAC tab: System Type → Heat Source → System Config → Capacity → Location → Qty → Contact → Quote
  - Services tab: Service picker → Contact → Confirmation
- **Portal** — Business dashboard at `/portal` to manage pricing, products, and leads
- **Leads** — Every widget submission is stored and optionally forwarded to a webhook (Make.com, Zapier, n8n, GHL)

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Database | Supabase (Postgres + RLS) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS + shadcn/ui |
| Deployment | Vercel |

---

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Add environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 3. Run migrations (Supabase SQL Editor)
# Execute files in scripts/ in order (001_*, 002_*, ...)

# 4. Start dev server
npm run dev
```

---

## Project structure

```
app/
  portal/          # Business dashboard (leads, pricing, settings)
  widget/[slug]/   # Public quote widget
  api/             # Route handlers (leads, widget data, webhooks)
components/
  portal/          # Dashboard UI components
  widget/          # Embeddable widget (widget-flow.tsx)
  ui/              # shadcn/ui primitives
lib/
  supabase/        # Client + server Supabase helpers
  types/           # TypeScript interfaces
scripts/           # SQL migrations (run in order in Supabase)
```

---

## Widget flow

```
HVAC tab
  System Type (Heating & Cooling / Heating / A/C)
    └─ Heat Source (Gas / Electric / Oil / Dual Fuel)  ← skipped for A/C
         └─ System Config (varies by combination)       ← skipped for Dual Fuel
              └─ Capacity → Location → Qty → Contact → Confirmation (3-tier quote)

Services tab
  Service picker → Contact → Confirmation (flat price)
```

---

## Webhook

Configure a webhook URL in Portal → Settings. On every lead submission the server posts:

```json
{
  "event": "lead.created",
  "lead": {
    "firstName", "lastName", "email", "phone",
    "productName", "capacityLabel", "tierSelected",
    "priceGood", "priceBetter", "priceBest",
    "submittedAt"
  }
}
```
