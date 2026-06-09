-- =========================================================================
-- CARX STREET STORE - SUPABASE DATABASE SCHEMAS
-- =========================================================================
-- Execute this SQL script in your Supabase project's SQL Editor (https://database.supabase.com)
-- to create all required tables, configure primary keys/constraints,
-- and seed initial default accounts/prices so they never disappear on redeployment.

-- 1. Drop existing tables if you want a fresh start (optional, keep commented out unless needed)
-- DROP TABLE IF EXISTS orders;
-- DROP TABLE IF EXISTS accounts;
-- DROP TABLE IF EXISTS patch_pricing;
-- DROP TABLE IF EXISTS settings;


-- 2. CREATE SYSTEM SETTINGS TABLE (Persistent Configs)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Admin Settings
INSERT INTO settings (key, value) VALUES
('gcash_number', '09123963204'),
('gcash_name', 'KA•L A.'),
('gcash_qr_url', 'https://pub-c2a2b0c3f0b2.r2.dev/gcash_qr_sample.png'),
('telegram_link', 'https://t.me/CarXResellerSupportBot'),
('is_online', 'true'),
('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;


-- 3. CREATE PATCH PRICING TABLE (Persistent Injection Prices)
CREATE TABLE IF NOT EXISTS patch_pricing (
    id SERIAL,
    patch_type TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    price NUMERIC NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Patch Formula Prices
INSERT INTO patch_pricing (id, patch_type, label, price, description) VALUES
(1, 'ban_safe_1', 'Ban-Safe Pack 1', 250.00, '10M Silver + 6K Gold'),
(2, 'ban_safe_2', 'Ban-Safe Pack 2', 150.00, '6M Silver + 1K Gold'),
(3, 'map_unlock', 'Map Unlock Only', 100.00, 'Unlocks all maps'),
(4, 'max_nitro', 'Max Nitro', 150.00, 'Max nitro for one car'),
(5, 'inject_car', 'Inject Custom Car', 150.00, 'Inject a specific car by Car ID'),
(6, 'custom_resources', 'Custom Resources', 150.00, 'Custom silver/gold amount')
ON CONFLICT (patch_type) DO NOTHING;


-- 4. CREATE PRE-MADE ACCOUNTS STOCK TABLE
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    silver NUMERIC DEFAULT 0,
    gold NUMERIC DEFAULT 0,
    xp INTEGER DEFAULT 0,
    cars_unlocked INTEGER DEFAULT 0,
    maps_unlocked INTEGER DEFAULT 0,
    price NUMERIC DEFAULT 0,
    image_url TEXT,
    car_images TEXT, -- Comma-separated list of vehicle image URLs
    snapshot_url TEXT,
    credentials TEXT, -- AES Encrypted JSON coordinates
    is_sold BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely alter table to add column if it already exists from a previous run
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS car_images TEXT;

-- Seed Initial Default Pre-Made accounts (matching base database.json)
-- Note: Encrypted credentials matching default AES algorithms
INSERT INTO accounts (id, name, silver, gold, xp, cars_unlocked, maps_unlocked, price, image_url, snapshot_url, credentials, is_sold) VALUES
('3e589bdc-15a5-48b9-8798-29ea30e70332', 'Elite High-Octane Garage', 25000000, 8500, 45, 12, 10, 499.00, 'hypercar_pack_bg', 'https://street-prod.carx-online.com/snapshots/elite.json', '7c43157463f02a0fd0fea717:46ca6c60ada0e797f9f62e16d643f3118f59212ee8079a24fa0958f5b6bc6533dc2c34e1e24c9d7a7ecbb7d66ebee496d96448e9109f99440dcc9bdf2e75d294b4f35565b6bc6533dc2c34e1e24c9d7a7ecbb7d66ebee496d96448e9109f99440dcc9bdf2e75d294b4f35565b6:6f8854f2e0685ff82894b9119b71f36a', FALSE),
('cb02aed3-bf30-4e4b-97cb-bc6046e729a6', 'Tokyo Drift Starter Pack', 12000000, 4000, 25, 7, 4, 299.00, 'drift_car_pack_bg', 'https://street-prod.carx-online.com/snapshots/tokyo.json', '06eac61c8498aab9e69dae05:02853937daf196964001673f0f789f38405e283c73123e7a60d6ce1acd0b02af2bdf9b8c2d45c721ae56b4c449ab133c5b24aa306c36474d66651865ab123e8dd11835d47d:e456fc8922ee9c5d798bf85e7313675b', FALSE)
ON CONFLICT (id) DO NOTHING;


-- 5. CREATE CUSTOMER ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL UNIQUE,
    order_type TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    account_id TEXT, -- References standard account packages
    delivered_email TEXT,
    delivered_password TEXT,
    amount_paid NUMERIC DEFAULT 0,
    gcash_ref_number TEXT UNIQUE,
    gcash_receipt_url TEXT,
    gcash_receipt_data JSONB, -- Stores full GCash metadata and receipt breakdown
    status TEXT NOT NULL, -- "pending", "completed", "failed"
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 6. CONFIGURE ROW LEVEL SECURITY (RLS) & SERVICE ROLE BYPASS
-- Since your backend uses SUPABASE_SERVICE_ROLE_KEY to authenticate with admin permissions,
-- it will bypass Row Level Security naturally. If you wish to also allow client-side
-- queries without user log-ins, you can enable policies or turn off RLS for simplicity:

ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE patch_pricing DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
