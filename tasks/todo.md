# B2B Ordering Portal — Implementation Plan

> **Workflow**: PLAN → RED → GREEN → REFACTOR → COMMIT (after every passing cycle)
> **Check off** items with `[x]` as they are completed.

---

## Phase 1: Foundation & Auth
> Goal: Running Next.js app, Supabase schema deployed, both auth flows working end-to-end.

### 1.1 — Project Scaffolding
- [ ] Initialize Next.js 14 (App Router, TypeScript, Tailwind CSS, ESLint)
- [ ] Run `shadcn-ui@latest init` (style: default, base color: neutral, CSS variables: yes)
- [ ] Install core dependencies:
  - `@supabase/ssr`, `@supabase/supabase-js`
  - `zod`
  - `jose` (custom JWT signing for buyer sessions)
  - `@upstash/ratelimit`, `@upstash/redis`
  - `resend`, `@react-email/components`
  - `@react-pdf/renderer`
  - `react-hook-form`, `@hookform/resolvers`
- [ ] Scaffold `.env.example` with all required variable placeholders
- [ ] Configure `tsconfig.json` path aliases (`@/*`)
- [ ] Verify `next build` passes with zero TS errors

### 1.2 — GitHub & CI/CD
- [ ] Set remote: `https://github.com/Luke-Petzer/Template-Ordering-Catagloue.git`
- [ ] Create `.github/workflows/ci.yml` — triggers on PRs to `main`
  - Job: `lint-and-typecheck` → runs `next lint` + `tsc --noEmit`
- [ ] Create `.gitignore` (Next.js standard + `.env*.local`)
- [ ] Initial commit: `chore: initialize project scaffold`

### 1.3 — Supabase Schema Deployment
- [ ] Verify `supabase/init.sql` is complete and reviewed (see file)
- [ ] Manually run `supabase/init.sql` in the Supabase SQL Editor
- [ ] Confirm all tables, RLS policies, and triggers are present in the dashboard
- [ ] Populate `.env.local` with real Supabase URL, anon key, service role key, JWT secret

### 1.4 — Supabase Client Setup (`@supabase/ssr`)
- [ ] **RED**: Write test asserting the server client returns a valid Supabase instance
- [ ] **GREEN**: Create `src/lib/supabase/server.ts` — server component / server action client (uses `cookies()`)
- [ ] Create `src/lib/supabase/middleware.ts` — middleware client
- [ ] Create `src/lib/supabase/admin.ts` — service role client (server-only, never exposed to client)
- [ ] **REFACTOR**: Extract shared config to `src/lib/supabase/config.ts`
- [ ] COMMIT: `feat: add Supabase SSR client utilities`

### 1.5 — Buyer Authentication (Account Number Login)
> Buyers are NOT Supabase Auth users. Auth is a custom signed JWT stored in an HTTP-only cookie.

- [ ] **RED**: Write test for `validateAccountNumber` — asserts valid format passes, invalid fails
- [ ] **GREEN**: Create `src/lib/auth/buyer.ts`:
  - `validateAccountNumber(input)` — Zod schema, alphanumeric + dash, 3–20 chars
  - `createBuyerSession(profile)` — signs JWT with `jose` using `SUPABASE_JWT_SECRET`, claims: `{ sub: profile.id, app_role: profile.role, account_number: profile.account_number, exp: 24h }`
  - `getBuyerSession(request)` — extracts + verifies JWT from cookie
- [ ] **RED**: Write test for the login Server Action — mock DB, assert cookie is set on valid account, error on invalid
- [ ] **GREEN**: Create `src/app/actions/auth.ts`:
  - `buyerLoginAction(formData)` — Zod validate → rate limit check → query profiles via admin client → create JWT → set `sb-buyer-session` HTTP-only cookie
- [ ] **REFACTOR**: Ensure no secrets leak; confirm cookie flags: `httpOnly`, `secure`, `sameSite: lax`
- [ ] COMMIT: `feat: implement buyer account number authentication`

### 1.6 — Admin Authentication (Supabase Auth Email + Password)
- [ ] **RED**: Write test asserting admin login calls `supabase.auth.signInWithPassword`
- [ ] **GREEN**: Create `src/app/actions/auth.ts` — add `adminLoginAction(formData)`:
  - Zod validate email + password
  - Call `supabase.auth.signInWithPassword` (SSR client handles cookie automatically)
  - Return typed error on failure
- [ ] **REFACTOR**: Unify error return types between buyer and admin actions
- [ ] COMMIT: `feat: implement admin email/password authentication`

### 1.7 — Auth Middleware & Route Protection
- [ ] **RED**: Write test for middleware — unauthenticated request to `/dashboard` redirects to `/login`
- [ ] **GREEN**: Create `src/middleware.ts`:
  - Check for `sb-buyer-session` cookie (buyer) OR Supabase auth session (admin)
  - Route `/admin/*` — admin only; redirect buyers to `/dashboard`
  - Route `/dashboard/*` — buyers and admins; redirect unauthenticated to `/login`
  - Public routes: `/login`, `/admin/login`, `/`
- [ ] Create `src/lib/auth/session.ts` — `getSession()` returns unified `{ role, profileId, accountNumber }` or `null`
- [ ] **REFACTOR**: Keep middleware lean — no DB calls, only JWT verification
- [ ] COMMIT: `feat: add auth middleware and route protection`

### 1.8 — Rate Limiting (Upstash Redis)
- [ ] **RED**: Write test asserting 6th login attempt within window returns 429
- [ ] **GREEN**: Create `src/lib/rate-limit.ts`:
  - Use `@upstash/ratelimit` sliding window: 5 requests / 60 seconds per IP
  - Export `buyerLoginLimiter` and `checkRateLimit(ip)` utility
- [ ] Wire into `buyerLoginAction` — check limit before any DB query
- [ ] **REFACTOR**: Ensure rate limiter gracefully degrades if Redis is unavailable (log + allow)
- [ ] COMMIT: `feat: add rate limiting to buyer login endpoint`

### 1.9 — Login UI Pages
- [ ] **RED**: Write component test asserting buyer login form renders account number input and submit
- [ ] **GREEN**: Create `src/app/(auth)/login/page.tsx` — Buyer login page:
  - Single "Account Number" input field (e.g., `RAS-00123`)
  - `react-hook-form` + Zod validation
  - Calls `buyerLoginAction` via `useTransition`
  - Shows inline error on failure (invalid account, rate limited)
  - Redirects to `/dashboard` on success
- [ ] Create `src/app/(auth)/admin/login/page.tsx` — Admin login page:
  - Email + Password fields
  - Calls `adminLoginAction`
  - Redirects to `/admin/dashboard` on success
- [ ] **REFACTOR**: Extract shared `<AuthCard>` layout component
- [ ] COMMIT: `feat: add buyer and admin login pages`

### 1.10 — Logout & Session Cleanup
- [ ] **GREEN**: Add `logoutAction` to `src/app/actions/auth.ts`:
  - Clears `sb-buyer-session` cookie for buyers
  - Calls `supabase.auth.signOut()` for admins
- [ ] Wire logout button into a shared `<Header>` component
- [ ] COMMIT: `feat: add logout action and header`

### 1.11 — Phase 1 Verification Checkpoint
- [ ] Run `npm run lint` — zero errors
- [ ] Run `tsc --noEmit` — zero errors
- [ ] Run all tests — all passing
- [ ] Manual test: buyer login with valid account → redirects to `/dashboard`
- [ ] Manual test: invalid account → error shown
- [ ] Manual test: 6 rapid login attempts → rate limited
- [ ] Manual test: admin login → redirects to `/admin/dashboard`
- [ ] Manual test: direct nav to `/dashboard` when logged out → redirects to `/login`
- [ ] COMMIT: `chore: phase 1 complete — foundation and auth`

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
