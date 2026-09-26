# StockSense

Real-time inventory management system built for the **Odoo × LPU Jalandhar Hackathon 2026**. Manages products, warehouses, locations, receipts, deliveries, internal transfers, stock adjustments, low-stock alerts, and a centralized stock movement ledger — modeled on Odoo's inventory workflow.

**Live demo:** [stocksense-odoo-puce.vercel.app](https://stocksense-odoo-puce.vercel.app/)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS, Radix UI primitives |
| Backend | Supabase (Postgres + Auth + Row Level Security) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Dates | date-fns, react-day-picker |

## Features

- **Auth** — email/password sign up & sign in, OTP-based password reset, session persistence
- **Product Directory** — SKU, category, unit of measure, reorder threshold/quantity, stock-on-hand and per-location stock
- **Operations** — Receipts (inbound), Deliveries (outbound), Internal Transfers, and Stock Adjustments, each with a document status lifecycle (`draft → waiting → ready → done`, or `cancelled`)
- **Stock Ledger** — every validated operation writes to a `stock_moves` table, giving a full audit trail of quantity changes by product/location
- **Dashboard** — live counts for total products, low-stock items, out-of-stock items, pending receipts/deliveries, pending transfers, plus recent stock activity and inventory alerts
- **Command Palette** — quick keyboard-driven navigation (`⌘K`)
- **Row Level Security** — enabled on every table; policies are scoped to `authenticated` users

## Project Structure

```
src/
├── App.jsx              # shell, auth-gated routing, session handling
├── AuthView.jsx          # sign in / sign up / password reset
├── ProductsView.jsx       # product directory CRUD
├── OperationsView.jsx      # receipts, deliveries, transfers, adjustments
├── SettingsView.jsx        # account settings
├── CommandPalette.jsx      # ⌘K quick nav
├── PrivacyView.jsx / TermsView.jsx
└── lib/
    ├── supabaseClient.js   # Supabase client init
    ├── auth.js             # auth helpers
    ├── products.js         # product CRUD
    ├── locations.js        # warehouses, locations, categories
    ├── operations.js       # receipts/deliveries/transfers/adjustments
    ├── inventory.js        # stock queries, dashboard aggregates
    └── profiles.js         # user profile helpers

supabase/
└── schema.sql            # full DB schema, enums, RLS policies (run once in Supabase SQL Editor)
```

## Local Setup

**Requirements:** Node.js 18+, a Supabase project.

```bash
git clone <this-repo>
cd StockSense-Odoo
npm install
```

1. Create a Supabase project.
2. Run `supabase/schema.sql` once in the Supabase SQL Editor (fresh database only — it uses `create table`, not `create table if not exists`).
3. Copy `.env.example` to `.env` and fill in your project's values:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Start the dev server:

```bash
npm run dev
```

Other scripts: `npm run build` (production build), `npm run preview` (preview the build), `npm run lint` (oxlint).

## Known Limitations

- **No multi-tenant isolation.** RLS policies on `warehouses`, `locations`, `categories`, and `products` currently allow any authenticated user to read/write all rows (`using (true)`). This is fine for a single-org demo but would need an `org_id`/membership-scoped policy before supporting multiple independent organizations.
- **Dashboard aggregates need verification against live mutations** — confirm counts update correctly immediately after creating/editing a product or operation, rather than only relying on a manual refresh.
- **No responsive breakpoint below desktop width** — the sidebar layout does not currently collapse on narrow viewports.

## License

Built for the Odoo × LPU Jalandhar Hackathon 2026.
