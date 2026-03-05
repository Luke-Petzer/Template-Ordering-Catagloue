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

## Phase 2: Catalog & Cart
> Goal: Full product catalog rendered from Supabase. Client-side cart with add/adjust/total. Order history with reorder flow.

### 2.1 — Product Catalog Page
- [ ] Create `src/app/(portal)/dashboard/page.tsx` — protected buyer route
- [ ] Server component fetches all active products via service role (RLS handles buyer visibility)
- [ ] Render products as a single scrolling page (no category filtering in UI)
- [ ] Build `<ProductCard>` component: image, name, SKU, price (ZAR), details, add-to-cart button
- [ ] Build `<ProductGrid>` component
- [ ] COMMIT: `feat: add product catalog page`

### 2.2 — Cart State (Client-Side)
- [ ] Create `src/lib/cart/store.ts` — Zustand store (or React Context):
  - State: `items: CartItem[]`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalAmount`
  - Persist to `localStorage` for session resilience
- [ ] Write unit tests for all cart operations
- [ ] Build `<CartSidebar>` or `<CartDrawer>` component
- [ ] Build `<CartBadge>` for header item count
- [ ] COMMIT: `feat: implement client-side cart state`

### 2.3 — Order History & Reorder
- [ ] Create `src/app/(portal)/orders/page.tsx` — fetches buyer's own orders via server action
- [ ] Build `<OrderHistoryTable>` component
- [ ] Build `<OrderDetailModal>` component
- [ ] Implement `reorderAction(orderId)`:
  - Fetch order_items for the given order
  - Merge into current cart state
  - Redirect to `/cart` for review
- [ ] Write tests for reorder merge logic (handles products no longer active)
- [ ] COMMIT: `feat: add order history and reorder flow`

---

## Phase 3: Divergent Checkout (RBAC)
> Goal: Checkout flow splits based on buyer role.

### 3.1 — Cart Review Page
- [ ] Create `src/app/(portal)/cart/page.tsx`
- [ ] Display cart items, quantities (editable), line totals, grand total (ZAR)
- [ ] "Proceed to Checkout" button

### 3.2 — Checkout Logic (Role-Aware)
- [ ] Create `checkoutAction(cartItems)` Server Action:
  - Validate session + cart with Zod
  - Insert `orders` record + `order_items` records atomically
  - Role branch:
    - `buyer_default` → redirect `/checkout/payment` (EFT details)
    - `buyer_30_day` → redirect `/checkout/confirmed?orderId=...`
- [ ] Write tests for both role branches

### 3.3 — EFT Payment Page
- [ ] Create `src/app/(portal)/checkout/payment/page.tsx`
- [ ] Display formatted invoice (Order ID, items, total) + static EFT bank details
- [ ] "I have made payment" → marks order status `pending`, redirects to confirmation

### 3.4 — Order Confirmation Page
- [ ] Create `src/app/(portal)/checkout/confirmed/page.tsx`
- [ ] Shows order summary and confirmation message
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
