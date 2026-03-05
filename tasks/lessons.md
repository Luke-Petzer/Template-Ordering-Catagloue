# Lessons Learned

> Rules derived from corrections and mistakes during this project.
> Update this file whenever a correction is made.

---

## Auth

- **Buyer JWT sub claim must equal profile.id** — Supabase's `auth.uid()` reads the `sub` claim from the JWT. For buyers, the custom JWT `sub` must be set to `profile.id` (not a fabricated value) so RLS policies using `auth.uid()` correctly isolate buyer data.

- **Admin profile.id must equal auth.users.id** — The `handle_new_admin_user` trigger inserts the profile with `id = NEW.id` (the auth user UUID). This is the critical condition that makes `auth.uid() = profile.id` true for admins and allows RLS to work without separate joins.

- **Never expose SUPABASE_SERVICE_ROLE_KEY or SUPABASE_JWT_SECRET to the client** — These are server-only secrets. Service role bypasses all RLS. JWT secret allows forging sessions.

## Schema

- **Snapshot product data in order_items** — Store `sku`, `product_name`, `unit_price` directly on `order_items` at insert time. Product edits or deletions must never corrupt historical order records.

- **line_total integrity is enforced at the DB layer** — The `trg_order_items_validate_line_total` trigger rejects any row where `line_total != ROUND(unit_price * quantity, 2)`. Do not attempt to bypass this; fix the application calculation instead.

## Rate Limiting

- **Rate limiter must degrade gracefully** — If Upstash Redis is unreachable, log the error but allow the request through. A broken rate limiter must not block legitimate logins.
