-- BaakiPay schema (PRD section 11)
-- Idempotent: safe to run multiple times.

CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_or_phone VARCHAR UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  shop_name VARCHAR,
  owner_name VARCHAR,
  bio TEXT,
  address TEXT,
  upi_id VARCHAR,
  cash_in_hand NUMERIC DEFAULT 0,
  default_credit_limit NUMERIC DEFAULT 15000,
  default_due_days INT DEFAULT 30,
  language VARCHAR DEFAULT 'en',
  plan VARCHAR DEFAULT 'trial' CHECK (plan IN ('trial','pro','free')),
  trial_expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days'),
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  upi_id VARCHAR,
  credit_limit NUMERIC DEFAULT 15000,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_code VARCHAR NOT NULL,
  items_json JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  due_date DATE NOT NULL,
  status VARCHAR CHECK (status IN ('UNPAID','PARTIAL','PAID')),
  payment_mode VARCHAR,
  last_reminded_at TIMESTAMP NULL,
  record_hash VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Milestone 4 additions (idempotent)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;

