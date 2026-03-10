# B2B Ordering Portal — Implementation Plan

> **Workflow**: PLAN → RED → GREEN → REFACTOR → COMMIT (after every passing cycle)
> **Check off** items with `[x]` as they are completed.

---

## Phase 1: Foundation & Auth
> Goal: Running Next.js app, Supabase schema deployed, both auth flows working end-to-end.

### 1.1 — Project Scaffolding ✅
- [x] Initialize Next.js 16 (App Router, TypeScript, Tailwind CSS, ESLint 9 flat config)
- [x] Run `shadcn@latest` init + add Button, Card, Input, Label components
- [x] Install all core dependencies
- [x] Configure `tsconfig.json` path aliases (`@/*`)
- [x] Verify `next build` passes with zero TS errors

### 1.2 — GitHub & CI/CD ✅
- [x] Set remote: `https://github.com/Luke-Petzer/Template-Ordering-Catagloue.git`
- [x] Create `.github/workflows/ci.yml` — triggers on PRs to `main` (lint + typecheck)
- [x] Create `.gitignore`
- [x] Initial commit

### 1.3 — Supabase Schema Deployment ✅ (manual step — done by user)
- [x] `supabase/init.sql` deployed to Supabase SQL Editor
- [x] `.env.local` populated with all real values

### 1.4 — Supabase Client Setup ✅
- [x] `src/lib/supabase/server.ts` — SSR server client
- [x] `src/lib/supabase/middleware.ts` — proxy client
- [x] `src/lib/supabase/admin.ts` — service role client (server-only)
- [x] `src/lib/supabase/config.ts` — shared env validation
- [x] `src/lib/supabase/types.ts` — hand-crafted Database types with Relationships

### 1.5 — Buyer Authentication ✅
- [x] `src/lib/auth/buyer.ts`: validateAccountNumber, createBuyerSession, verifyBuyerSession
- [x] `src/app/actions/auth.ts`: buyerLoginAction (Zod → rate limit → DB → JWT cookie → redirect)

### 1.6 — Admin Authentication ✅
- [x] `src/app/actions/auth.ts`: adminLoginAction (Supabase Auth email + password)

### 1.7 — Route Protection ✅
- [x] `src/proxy.ts`: Next.js 16 proxy guards /dashboard/* and /admin/*
- [x] `src/lib/auth/session.ts`: getSession() — unified buyer + admin session resolver

### 1.8 — Rate Limiting ✅
- [x] `src/lib/rate-limit.ts`: Upstash sliding window 5 req/60s, graceful degradation

### 1.9 — Login UI Pages ✅
- [x] `src/app/(auth)/login/page.tsx` — buyer account number login
- [x] `src/app/(auth)/admin/login/page.tsx` — admin email + password login
- [x] `src/components/auth/AuthCard.tsx` — shared layout

### 1.10 — Logout ✅
- [x] logoutAction in auth.ts — clears buyer cookie + Supabase Auth session
- [x] Logout button on placeholder dashboard pages

### 1.11 — Phase 1 Verification Checkpoint
- [ ] Manual test: buyer login with valid account → redirects to `/dashboard`
- [ ] Manual test: invalid account → error shown
- [ ] Manual test: 6 rapid login attempts → rate limited
- [ ] Manual test: admin login → redirects to `/admin/dashboard`
- [ ] Manual test: direct nav to `/dashboard` when logged out → redirects to `/login`

---

## Design System (Superdesign — Project 2925902b)
> Reference designs fetched. Implement consistently across all buyer-facing pages.

### Design Tokens
- **Font**: Inter (400/500/600/700) — add to `layout.tsx` via Google Fonts
- **Primary**: `#0f172a` (slate-900) — buttons, active states, logo bg
- **Background**: `#ffffff` / `#fafafa` / `#fcfcfc` (white with subtle tints)
- **Border**: `border-gray-100` throughout
- **Muted text**: `text-gray-500` (body), `text-gray-400` (labels/placeholders)
- **Table headers**: `text-[11px] font-semibold text-gray-400 uppercase tracking-wider`
- **Nav height**: `h-[64px]`, sticky top, `border-b border-gray-100 bg-white`
- **Active nav**: underline `::after` 2px `bg-slate-900`, offset below nav
- **Button primary**: `bg-slate-900 text-white rounded hover:bg-slate-800`
- **Button secondary**: `bg-gray-100 text-gray-700 rounded hover:bg-gray-200`
- **Cards**: `bg-white border border-gray-100 rounded-lg`
- **Icons**: Iconify lucide set (`lucide:package`, `lucide:layers`, etc.)
- **Grid**: 8px base unit

### Superdesign Draft References
| Page | Draft ID | Route |
|---|---|---|
| Login (buyer) | `e14f4ab3` | `/login` |
| Product Catalogue | `5aaa2ae4` | `/dashboard` |
| Cart Review | `26bc23e2` | `/cart` |
| Order Confirmation | `ea88ab06` | `/checkout/confirmed` |
| Order History | `2e065511` | `/orders` |

### Key Layout Patterns
- **Catalogue**: `h-screen overflow-hidden flex flex-col` — full viewport, no scroll on nav. Main splits: `flex-1 overflow-y-auto` (product list) + `w-[400px] border-l` (cart sidebar)
- **Cart Review**: `max-w-[1440px] mx-auto` — `grid grid-cols-12` — 8 cols table + 4 cols sticky summary
- **Order History**: `max-w-[1200px] mx-auto` — full-width table with accordion expand
- **Confirmation**: Floating blurred nav `bg-white/80 backdrop-blur-md` + centered success card `max-w-[560px]`

---

## Phase 2: Catalog & Cart
> Goal: Full product catalog rendered from Supabase. Client-side cart with add/adjust/total. Order history with reorder flow.
> Design: Elite SaaS — Inter font, slate-900 primary, 8px grid, top nav, high-density table layout.

### 2.0 — Design System Foundation ✅ (types updated)
- [x] `src/lib/supabase/types.ts` updated to v2 normalized schema (12 tables)
- [ ] Add Inter font to `src/app/layout.tsx` (Google Fonts)
- [ ] Set `font-family: 'Inter'` as Tailwind base in `globals.css`
- [ ] Install Zustand: `npm install zustand`
- [ ] Install Iconify React: `npm install @iconify/react`

### 2.1 — Shared Components
- [ ] `src/components/portal/NavBar.tsx` — 64px top nav: logo + Catalogue/Order History links + Logout
  - Active link state: underline indicator via `::after`
  - `currentPath` prop to highlight active link
- [ ] `src/components/portal/QuantityStepper.tsx` — `-` / `input[number]` / `+` with min=1

### 2.2 — Cart State (Client-Side)
- [ ] Install Zustand: `npm install zustand`
- [ ] `src/lib/cart/store.ts` — Zustand store:
  - `CartItem`: `{ productId, sku, name, unitPrice, quantity, variantInfo? }`
  - Actions: `addItem`, `updateQuantity`, `removeItem`, `clearCart`
  - Computed: `subtotal`, `vatAmount` (from tenant vat_rate), `total`
  - Persist to `localStorage`
- [ ] `src/components/portal/CartSidebar.tsx` — 400px right panel (design: draft 5aaa2ae4):
  - Item list: thumbnail icon + SKU + name + qty + line total + remove button
  - Footer: subtotal / est. shipping / total + "Review Order" → `/cart`

### 2.3 — Product Catalog Page
- [ ] `src/app/(portal)/dashboard/page.tsx` — server component, fetches active products + tenant_config
- [ ] Layout: `h-screen overflow-hidden flex flex-col` + sticky 64px NavBar + SKU search bar + split main
- [ ] `src/components/portal/ProductRow.tsx` — grid row (design: draft 5aaa2ae4):
  - Columns: `60px thumb | 140px SKU | 1fr description | 120px price | 140px qty stepper | 100px Add button`
  - Thumbnail: primary image from `product_images`, fallback to `lucide:package` icon
  - "Add" button calls `cartStore.addItem()`
- [ ] SKU search: client-side filter on `sku` and `name` fields (no server round-trip)
- [ ] COMMIT: `feat: add product catalog with cart sidebar`

### 2.4 — Order History & Reorder
- [ ] `src/app/(portal)/orders/page.tsx` — server component, fetches buyer's orders with item counts
- [ ] Layout: `max-w-[1200px] mx-auto` + 64px NavBar (Order History tab active)
- [ ] `src/components/portal/OrderHistoryTable.tsx` (design: draft 2e065511):
  - Columns: Date | Reference ID | Items | Total | Reorder button
  - Accordion expand row: inline `<table>` of line items (SKU | Description | Unit | Qty | Subtotal)
  - Pagination: page-based (10 per page)
- [ ] `reorderAction(orderId)` — server action: fetch order_items → merge into cart → redirect `/cart`
- [ ] COMMIT: `feat: add order history with accordion and reorder`

---

## Phase 3: Divergent Checkout (RBAC)
> Goal: Checkout flow splits based on buyer role.
> Design: Cart Review (draft 26bc23e2) + Order Confirmation (draft ea88ab06).

### 3.1 — Cart Review Page
- [ ] `src/app/(portal)/cart/page.tsx` — reads from Zustand store (client component wrapper)
- [ ] Layout: `max-w-[1440px] grid grid-cols-12` (design: draft 26bc23e2):
  - 8-col table: SKU | Description | editable Qty stepper | Line Total
  - 4-col sticky summary card (`bg-slate-100 rounded-lg p-6`): subtotal + VAT + total + CTA button
  - CTA → `checkoutAction` (server action)

### 3.2 — Checkout Logic (Role-Aware)
- [ ] `src/app/actions/checkout.ts` — `checkoutAction(cartItems)` Server Action:
  - Validate session + cart with Zod
  - Compute: subtotal, vat_amount (tenant vat_rate), total_amount
  - Insert `orders` + `order_items` atomically via service role client
  - Clear cart after insert
  - Role branch:
    - `buyer_default` → redirect `/checkout/payment?orderId=...`
    - `buyer_30_day` → set status `confirmed` → redirect `/checkout/confirmed?orderId=...`

### 3.3 — EFT Payment Page
- [ ] `src/app/(portal)/checkout/payment/page.tsx` — server component, loads order + tenant_config bank details
- [ ] Display: order reference, items summary, total + EFT bank details grid
- [ ] "I have made payment" button → `markPaymentSubmittedAction` → inserts into `payments` table, redirects to `/checkout/confirmed?orderId=...`

### 3.4 — Order Confirmation Page
- [ ] `src/app/(portal)/checkout/confirmed/page.tsx` (design: draft ea88ab06):
  - Floating blurred nav: `bg-white/80 backdrop-blur-md rounded-2xl`
  - Success card `max-w-[560px]`: green check icon + order reference + total + EFT bank details grid
  - "Download Invoice PDF" CTA (wired up in Phase 4)
  - "Return to Catalogue" link
- [ ] COMMIT: `feat: implement divergent checkout flow with RBAC`

---

## Phase 4: Automated Fulfillment
> Goal: PDF invoice generation + dual email delivery on order confirmation.

### 4.1 — PDF Invoice Generator
- [ ] Create `src/lib/pdf/invoice.tsx` using `@react-pdf/renderer`
- [ ] Required fields: Order ID, Date, Client Account Number, Client Name
- [ ] Table: SKU | Product Name | Quantity | Unit Price | Line Total
- [ ] Grand total footer
- [ ] Write snapshot test for PDF structure

### 4.2 — React Email Templates
- [ ] Create `src/emails/SupplierInvoice.tsx` — supplier notification with PDF attachment
- [ ] Create `src/emails/BuyerConfirmation.tsx` — buyer order receipt (no PDF)

### 4.3 — Order Confirmation API Route
- [ ] Create `src/app/api/orders/confirm/route.ts` (POST, Edge-compatible)
- [ ] On call: generate PDF → send supplier email with attachment → send buyer receipt
- [ ] Trigger from `checkoutAction` after DB insert
- [ ] Write integration test with mocked Resend
- [ ] COMMIT: `feat: add PDF invoice generation and email delivery`

---

## Phase 5: Admin Dashboard
> Goal: Full admin CRUD for products, orders, and client profiles.

### 5.1 — Admin Layout & Navigation
- [ ] Create `src/app/(admin)/admin/layout.tsx` — admin-only layout with sidebar nav
- [ ] Nav items: Dashboard, Products, Orders, Clients

### 5.2 — Product Management
- [ ] `src/app/(admin)/admin/products/page.tsx` — list all products
- [ ] Add product form (SKU, name, description, price, image URL, details, category, variants JSON)
- [ ] Edit product form (pre-populated)
- [ ] Soft-delete (set `is_active = false`)
- [ ] Server Actions: `createProductAction`, `updateProductAction`, `deactivateProductAction`
- [ ] Zod validation on all actions

### 5.3 — Order Ledger
- [ ] `src/app/(admin)/admin/orders/page.tsx` — paginated order list, all buyers
- [ ] Filter by status, date range, buyer
- [ ] Order detail view with item breakdown
- [ ] Admin can update order status

### 5.4 — Client Profile Management
- [ ] `src/app/(admin)/admin/clients/page.tsx` — list all profiles
- [ ] Create client profile (sets account_number, role, business_name, contact_name, email)
- [ ] Edit client (update role: `buyer_default` ↔ `buyer_30_day`, toggle `is_active`)
- [ ] Server Actions: `createClientAction`, `updateClientAction`
- [ ] Zod validation on all actions
- [ ] COMMIT: `feat: implement admin dashboard with CRUD for products, orders, clients`

---

## Backlog / Future Enhancements
- [ ] Buyer session revocation table (invalidate tokens server-side)
- [ ] Stock / inventory management on products
- [ ] Product image upload (Supabase Storage)
- [ ] Bulk CSV product import
- [ ] Direct Omni v7 XML/CSV export
- [ ] SMS notifications via Twilio
