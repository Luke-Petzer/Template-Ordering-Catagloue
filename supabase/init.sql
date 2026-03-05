-- ============================================================
-- B2B Ordering Portal — Supabase Database Initialization
-- ============================================================
-- Instructions:
--   1. Open your Supabase project → SQL Editor → New Query
--   2. Paste this entire file and click "Run"
--   3. Verify in Table Editor that all tables are present
--
-- Auth Strategy:
--   Admins  → Supabase Auth (email + password). profile.id === auth.users.id
--   Buyers  → Custom JWT signed with SUPABASE_JWT_SECRET.
--             profile.id is used as the JWT 'sub' claim so auth.uid() resolves correctly.
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE public.app_role AS ENUM (
  'admin',
  'buyer_default',
  'buyer_30_day'
);

CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'fulfilled',
  'cancelled'
);

CREATE TYPE public.payment_method AS ENUM (
  'eft',
  '30_day_account'
);


-- ============================================================
-- HELPER FUNCTIONS
-- Must be created before RLS policies reference them.
-- ============================================================

-- Reads the 'app_role' claim from the current request JWT.
CREATE OR REPLACE FUNCTION public.get_app_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (auth.jwt() ->> 'app_role')::public.app_role;
$$;

-- Returns true if the current authenticated user is an admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.get_app_role() = 'admin';
$$;


-- ============================================================
-- TABLE: profiles
-- ============================================================
-- Stores all user accounts: both admins and buyers.
--
-- Admin rows:  id === auth.users.id, auth_user_id IS NOT NULL, account_number IS NULL
-- Buyer rows:  id is a fresh UUID,   auth_user_id IS NULL,     account_number IS NOT NULL

CREATE TABLE public.profiles (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Links to Supabase Auth only for admins. NULL for all buyer rows.
  auth_user_id    UUID          UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Buyer login credential. NULL for admin rows.
  account_number  TEXT          UNIQUE,
  role            public.app_role NOT NULL DEFAULT 'buyer_default',
  business_name   TEXT          NOT NULL,
  contact_name    TEXT          NOT NULL,
  email           TEXT,
  phone           TEXT,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Structural integrity constraints
  CONSTRAINT admin_requires_auth_user
    CHECK (role != 'admin' OR auth_user_id IS NOT NULL),
  CONSTRAINT buyer_requires_account_number
    CHECK (role = 'admin' OR account_number IS NOT NULL),
  CONSTRAINT account_number_format
    CHECK (account_number IS NULL OR account_number ~ '^[A-Z0-9][A-Z0-9\-]{1,18}[A-Z0-9]$')
);

COMMENT ON TABLE public.profiles IS
  'Unified user table. Admins link to auth.users; buyers authenticate via custom JWT.';
COMMENT ON COLUMN public.profiles.auth_user_id IS
  'Foreign key to auth.users. Populated for admins only.';
COMMENT ON COLUMN public.profiles.account_number IS
  'Buyer login credential (e.g. RAS-00123). Null for admins.';


-- ============================================================
-- TABLE: products
-- ============================================================

CREATE TABLE public.products (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku         TEXT          NOT NULL UNIQUE,
  name        TEXT          NOT NULL,
  description TEXT,
  -- Price stored in ZAR (South African Rand), 2 decimal places
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url   TEXT,
  details     TEXT,
  category    TEXT,
  -- Flexible variants structure. Example:
  -- [{"label": "Size", "options": ["500ml", "1L", "5L"]}]
  variants    JSONB         NOT NULL DEFAULT '[]'::jsonb,
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.products.variants IS
  'JSONB array of variant groups. Example: [{"label":"Size","options":["500ml","1L"]}]';
COMMENT ON COLUMN public.products.price IS
  'Price in South African Rand (ZAR).';


-- ============================================================
-- TABLE: orders
-- ============================================================

CREATE TABLE public.orders (
  id              UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID                  NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status          public.order_status   NOT NULL DEFAULT 'pending',
  payment_method  public.payment_method NOT NULL,
  total_amount    NUMERIC(10,2)         NOT NULL CHECK (total_amount >= 0),
  notes           TEXT,
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.orders.payment_method IS
  'eft = buyer_default role (EFT payment page); 30_day_account = buyer_30_day role (auto-confirmed).';


-- ============================================================
-- TABLE: order_items
-- ============================================================
-- Product fields are snapshotted at order time.
-- This preserves order accuracy even if a product is later edited or deleted.

CREATE TABLE public.order_items (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID          NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  -- Nullable: product may be deleted, but the snapshot fields below are preserved.
  product_id    UUID          REFERENCES public.products(id) ON DELETE SET NULL,
  -- Snapshotted fields from products at time of order
  sku           TEXT          NOT NULL,
  product_name  TEXT          NOT NULL,
  unit_price    NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity      INTEGER       NOT NULL CHECK (quantity > 0),
  line_total    NUMERIC(10,2) NOT NULL CHECK (line_total >= 0),
  -- Captures selected variant at time of order (e.g. {"label":"Size","value":"1L"})
  variant_info  JSONB         DEFAULT NULL
);

COMMENT ON TABLE public.order_items IS
  'Line items with snapshotted product data. Accurate even after product edits.';


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_account_number
  ON public.profiles(account_number)
  WHERE account_number IS NOT NULL;

CREATE INDEX idx_profiles_auth_user_id
  ON public.profiles(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX idx_profiles_role
  ON public.profiles(role);

CREATE INDEX idx_profiles_is_active
  ON public.profiles(is_active);

CREATE INDEX idx_products_sku
  ON public.products(sku);

CREATE INDEX idx_products_category
  ON public.products(category);

CREATE INDEX idx_products_is_active
  ON public.products(is_active);

CREATE INDEX idx_orders_profile_id
  ON public.orders(profile_id);

CREATE INDEX idx_orders_status
  ON public.orders(status);

CREATE INDEX idx_orders_created_at
  ON public.orders(created_at DESC);

CREATE INDEX idx_order_items_order_id
  ON public.order_items(order_id);

CREATE INDEX idx_order_items_product_id
  ON public.order_items(product_id);


-- ============================================================
-- TRIGGER: updated_at auto-maintenance
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================
-- TRIGGER: line_total integrity validation
-- ============================================================
-- Guards against application bugs where line_total is miscalculated.

CREATE OR REPLACE FUNCTION public.validate_line_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.line_total <> ROUND(NEW.unit_price * NEW.quantity, 2) THEN
    RAISE EXCEPTION
      'line_total integrity violation: expected % (% * %), got %',
      ROUND(NEW.unit_price * NEW.quantity, 2),
      NEW.unit_price,
      NEW.quantity,
      NEW.line_total;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_items_validate_line_total
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_line_total();


-- ============================================================
-- TRIGGER: auto-create admin profile on Supabase Auth sign-up
-- ============================================================
-- When an admin is created via Supabase Auth (with metadata role = 'admin'),
-- this trigger auto-inserts a profile row where profile.id === auth.users.id.
-- This is the required condition for admin RLS to work via auth.uid().

CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data ->> 'role' = 'admin' THEN
    INSERT INTO public.profiles (
      id,
      auth_user_id,
      role,
      business_name,
      contact_name,
      email
    ) VALUES (
      NEW.id,           -- CRITICAL: profile.id === auth.users.id for admin RLS
      NEW.id,
      'admin',
      COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'Admin'),
      COALESCE(NEW.raw_user_meta_data ->> 'contact_name', 'Administrator'),
      NEW.email
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- RLS: profiles
-- ------------------------------------------------------------

-- Admins can read all profiles
CREATE POLICY "admins_select_all_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Buyers can only read their own profile
CREATE POLICY "buyers_select_own_profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() AND NOT public.is_admin());

-- Only admins can create profiles (buyer accounts are provisioned by admin)
CREATE POLICY "admins_insert_profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Only admins can update profiles
CREATE POLICY "admins_update_profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete profiles
CREATE POLICY "admins_delete_profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------
-- RLS: products
-- ------------------------------------------------------------

-- All authenticated users see active products; admins see all (including inactive)
CREATE POLICY "select_products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_admin());

-- Only admins can create, update, or delete products
CREATE POLICY "admins_insert_products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admins_update_products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admins_delete_products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------
-- RLS: orders
-- ------------------------------------------------------------

-- Buyers see only their own orders; admins see all
CREATE POLICY "select_orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin());

-- Buyers can only insert orders for themselves
CREATE POLICY "buyers_insert_own_orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid() AND NOT public.is_admin());

-- Admins can update any order (e.g. change status)
CREATE POLICY "admins_update_orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can cancel/delete orders
CREATE POLICY "admins_delete_orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------
-- RLS: order_items
-- ------------------------------------------------------------

-- Users can only see items belonging to orders they have access to
CREATE POLICY "select_order_items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.profile_id = auth.uid() OR public.is_admin())
    )
  );

-- Buyers can only insert items into their own orders
CREATE POLICY "buyers_insert_order_items"
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.profile_id = auth.uid()
    )
  );

-- Admins can update order items (e.g. corrections)
CREATE POLICY "admins_update_order_items"
  ON public.order_items
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- SEED: Create the first admin user
-- ============================================================
-- After running this script, create your admin via the Supabase
-- Authentication dashboard (or Auth API) with this metadata:
--
--   Email:    your-admin@example.com
--   Password: (strong password — stored hashed by Supabase Auth)
--   Metadata: { "role": "admin", "business_name": "Your Business", "contact_name": "Your Name" }
--
-- The trigger `trg_on_auth_user_created` will automatically insert
-- the admin profile row. No manual INSERT needed.
--
-- ============================================================
-- END OF INITIALIZATION SCRIPT
-- ============================================================
