-- ============================================================
-- Ekebim - Gelir Gider Takip - Supabase SQL Şeması
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

-- 1. TABLOLAR

CREATE TABLE IF NOT EXISTS categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  type       text NOT NULL CHECK (type IN ('income', 'expense')),
  color      text NOT NULL DEFAULT '#6366f1',
  icon       text DEFAULT 'tag',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name, type)
);

CREATE TABLE IF NOT EXISTS transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id      uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  type             text NOT NULL CHECK (type IN ('income', 'expense')),
  amount           numeric(12, 2) NOT NULL CHECK (amount > 0),
  description      text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method   text NOT NULL DEFAULT 'cash'
                   CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card')),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category_id);

-- 2. UPDATED_AT TRIGGER

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. ROW LEVEL SECURITY

ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_owner_all" ON categories;
CREATE POLICY "categories_owner_all" ON categories
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_owner_all" ON transactions;
CREATE POLICY "transactions_owner_all" ON transactions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3b. PERSONELLER TABLOSU

CREATE TABLE IF NOT EXISTS staff (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  position     text,
  monthly_salary numeric(12, 2),
  active       boolean NOT NULL DEFAULT true,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_user ON staff(user_id);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES staff(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_staff ON transactions(staff_id);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_owner_all" ON staff;
CREATE POLICY "staff_owner_all" ON staff
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3c. MÜŞTERİLER TABLOSU

CREATE TABLE IF NOT EXISTS customers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  contact    text,
  phone      text,
  email      text,
  notes      text,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_owner_all" ON customers;
CREATE POLICY "customers_owner_all" ON customers
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3d. SABİTLER TABLOSU (Beklenen aylık gelir/gider kalemleri)

CREATE TABLE IF NOT EXISTS fixed_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  type       text NOT NULL CHECK (type IN ('income', 'expense')),
  amount     numeric(12, 2) NOT NULL CHECK (amount > 0),
  frequency  text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'yearly')),
  due_day    integer CHECK (due_day BETWEEN 1 AND 31),
  due_month  integer CHECK (due_month BETWEEN 1 AND 12),
  active     boolean NOT NULL DEFAULT true,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fixed_items_user ON fixed_items(user_id);

ALTER TABLE fixed_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fixed_items_owner_all" ON fixed_items;
CREATE POLICY "fixed_items_owner_all" ON fixed_items
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER trg_fixed_items_updated_at
  BEFORE UPDATE ON fixed_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3e. İŞLEM DEĞİŞİKLİK GEÇMİŞİ

CREATE TABLE IF NOT EXISTS transaction_history (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL,
  changed_at     timestamptz NOT NULL DEFAULT now(),
  old_data       jsonb NOT NULL,
  new_data       jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tx_history_transaction ON transaction_history(transaction_id, changed_at DESC);

ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tx_history_owner_select" ON transaction_history;
CREATE POLICY "tx_history_owner_select" ON transaction_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION log_transaction_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO transaction_history (transaction_id, user_id, old_data, new_data)
  VALUES (OLD.id, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_transaction_history ON transactions;
CREATE TRIGGER trg_transaction_history
  AFTER UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION log_transaction_change();

-- 3f. FİŞ/FATURA DEPOLAMA

-- transactions tablosuna receipt_url kolonu ekle
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_url text;

-- Supabase Storage bucket (Dashboard > Storage > New bucket üzerinden de yapılabilir)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('receipts', 'receipts', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage RLS: kullanıcı kendi klasörüne erişebilir
CREATE POLICY "receipts_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');

CREATE POLICY "receipts_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "receipts_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 4. VARSAYILAN KATEGORİLER (SEED)
-- ÖNEMLİ: Aşağıdaki <USER_ID> kısmını gerçek kullanıcı UUID'si ile değiştirin
-- Supabase Dashboard > Authentication > Users'dan kopyalayın
-- ============================================================

-- INSERT INTO categories (user_id, name, type, color, icon) VALUES
--   ('<USER_ID>', 'Satış Geliri',     'income',  '#22c55e', 'shopping-bag'),
--   ('<USER_ID>', 'Diğer Gelir',      'income',  '#3b82f6', 'plus-circle'),
--   ('<USER_ID>', 'Un',               'expense', '#ef4444', 'package'),
--   ('<USER_ID>', 'Yağ',              'expense', '#f97316', 'droplets'),
--   ('<USER_ID>', 'Şeker',            'expense', '#eab308', 'cookie'),
--   ('<USER_ID>', 'Kira',             'expense', '#8b5cf6', 'home'),
--   ('<USER_ID>', 'Personel Maaşı',   'expense', '#ec4899', 'users'),
--   ('<USER_ID>', 'Elektrik & Su',    'expense', '#06b6d4', 'zap'),
--   ('<USER_ID>', 'Paketleme',        'expense', '#84cc16', 'box'),
--   ('<USER_ID>', 'Diğer Gider',      'expense', '#6b7280', 'minus-circle');

-- ============================================================
-- 5. TEDARİKÇİLER
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  contact    text,
  phone      text,
  email      text,
  notes      text,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_user ON suppliers(user_id);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suppliers_owner_all" ON suppliers;
CREATE POLICY "suppliers_owner_all" ON suppliers
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- transactions tablosuna supplier_id kolonu ekle
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;

-- fixed_items tablosuna supplier_id kolonu ekle (opsiyonel, sabit giderde tedarikçi bağlantısı için)
ALTER TABLE fixed_items ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;

-- ============================================================
-- 6. PROFİLLER (Kullanıcı yetkileri)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id                 uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name          text,
  email              text,
  can_access_finance boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_owner_select" ON profiles;
CREATE POLICY "profiles_owner_select" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "profiles_owner_insert" ON profiles;
CREATE POLICY "profiles_owner_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_owner_update" ON profiles;
CREATE POLICY "profiles_owner_update" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- email kolonu (mevcut tabloya ekle)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Yeni kullanıcı kaydolduğunda otomatik profil oluştur
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_profile ON auth.users;
CREATE TRIGGER trg_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- ============================================================
-- 7. TAKVİM PLANLARI (Personel haftalık planlayıcı)
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_plans (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start   date NOT NULL, -- o haftanın Pazartesi tarihi
  day_of_week  integer NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Pazartesi, 7=Pazar
  hour         integer NOT NULL CHECK (hour BETWEEN 0 AND 23),
  title        text NOT NULL,
  description  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start, day_of_week, hour)
);

CREATE INDEX IF NOT EXISTS idx_calendar_plans_user_week ON calendar_plans(user_id, week_start);

ALTER TABLE calendar_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_plans_owner_all" ON calendar_plans;
CREATE POLICY "calendar_plans_owner_all" ON calendar_plans
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER trg_calendar_plans_updated_at
  BEFORE UPDATE ON calendar_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- user_email kolonu (kimin planı olduğunu göstermek için)
ALTER TABLE calendar_plans ADD COLUMN IF NOT EXISTS user_email text;

-- hour_end kolonu (çok saatli planlar için bitiş saati, exclusive)
ALTER TABLE calendar_plans ADD COLUMN IF NOT EXISTS hour_end integer;
UPDATE calendar_plans SET hour_end = hour + 1 WHERE hour_end IS NULL;
ALTER TABLE calendar_plans ALTER COLUMN hour_end SET NOT NULL;

-- ============================================================
-- 9. KASA, BORÇLAR, AVANSLAR
-- ============================================================

-- 9a. KASA
CREATE TABLE IF NOT EXISTS kasa_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('in', 'out')),
  amount      numeric(12,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  entry_date  date NOT NULL DEFAULT CURRENT_DATE,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kasa_user ON kasa_entries(user_id, entry_date DESC);
ALTER TABLE kasa_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kasa_select" ON kasa_entries FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "kasa_insert" ON kasa_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "kasa_update" ON kasa_entries FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "kasa_delete" ON kasa_entries FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE OR REPLACE TRIGGER trg_kasa_updated_at
  BEFORE UPDATE ON kasa_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9b. BORÇLAR
CREATE TABLE IF NOT EXISTS debts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('payable', 'receivable')),
  contact_name text NOT NULL,
  amount       numeric(12,2) NOT NULL CHECK (amount > 0),
  description  text,
  due_date     date,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "debts_select" ON debts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "debts_insert" ON debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "debts_update" ON debts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "debts_delete" ON debts FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE OR REPLACE TRIGGER trg_debts_updated_at
  BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9c. AVANSLAR
CREATE TABLE IF NOT EXISTS advances (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id     uuid REFERENCES staff(id) ON DELETE SET NULL,
  person_name  text NOT NULL,
  amount       numeric(12,2) NOT NULL CHECK (amount > 0),
  description  text,
  advance_date date NOT NULL DEFAULT CURRENT_DATE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'returned', 'deducted')),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_advances_user ON advances(user_id);
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advances_select" ON advances FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "advances_insert" ON advances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "advances_update" ON advances FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "advances_delete" ON advances FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE OR REPLACE TRIGGER trg_advances_updated_at
  BEFORE UPDATE ON advances FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Takvim paylaşımlı erişim: herkes görebilir, sadece kendi planını düzenleyebilir
DROP POLICY IF EXISTS "calendar_plans_owner_all" ON calendar_plans;
CREATE POLICY "calendar_plans_select" ON calendar_plans FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "calendar_plans_insert" ON calendar_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calendar_plans_update" ON calendar_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "calendar_plans_delete" ON calendar_plans FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 8. FİNANS TABLOLARI PAYLAŞIMLI ERİŞİM
-- Tüm oturum açmış kullanıcılar finans verilerini görebilir ve düzenleyebilir.
-- INSERT: user_id = auth.uid() (audit için kendi id'si atanır)
-- UPDATE/DELETE: herhangi bir oturum açmış kullanıcı yapabilir
-- ============================================================

-- Yardımcı makro: tablo adı verilerek 4 ayrı policy oluşturulur
-- (Supabase SQL'de fonksiyon yok, her tablo için tekrarlıyoruz)

-- categories
DROP POLICY IF EXISTS "categories_owner_all"   ON categories;
DROP POLICY IF EXISTS "categories_shared"       ON categories;
CREATE POLICY "categories_select" ON categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (auth.uid() IS NOT NULL);

-- transactions
DROP POLICY IF EXISTS "transactions_owner_all" ON transactions;
DROP POLICY IF EXISTS "transactions_shared"    ON transactions;
CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING (auth.uid() IS NOT NULL);

-- staff
DROP POLICY IF EXISTS "staff_owner_all" ON staff;
DROP POLICY IF EXISTS "staff_shared"    ON staff;
CREATE POLICY "staff_select" ON staff FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff_insert" ON staff FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff_update" ON staff FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff_delete" ON staff FOR DELETE USING (auth.uid() IS NOT NULL);

-- customers
DROP POLICY IF EXISTS "customers_owner_all" ON customers;
DROP POLICY IF EXISTS "customers_shared"    ON customers;
CREATE POLICY "customers_select" ON customers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_update" ON customers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "customers_delete" ON customers FOR DELETE USING (auth.uid() IS NOT NULL);

-- suppliers
DROP POLICY IF EXISTS "suppliers_owner_all" ON suppliers;
DROP POLICY IF EXISTS "suppliers_shared"    ON suppliers;
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE USING (auth.uid() IS NOT NULL);

-- fixed_items
DROP POLICY IF EXISTS "fixed_items_owner_all" ON fixed_items;
DROP POLICY IF EXISTS "fixed_items_shared"    ON fixed_items;
CREATE POLICY "fixed_items_select" ON fixed_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "fixed_items_insert" ON fixed_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fixed_items_update" ON fixed_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "fixed_items_delete" ON fixed_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- transaction_history (sadece okuma)
DROP POLICY IF EXISTS "tx_history_owner_select"  ON transaction_history;
DROP POLICY IF EXISTS "tx_history_shared_select" ON transaction_history;
CREATE POLICY "tx_history_select" ON transaction_history FOR SELECT USING (auth.uid() IS NOT NULL);
