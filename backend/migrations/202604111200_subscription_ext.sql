-- Fasa 12: Stripe Subscription Enhancements

-- 1. Tambah Stripe Customer ID ke jadual Users
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='stripe_customer_id') THEN
        ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE;
    END IF;
END $$;

-- 2. Tambah Project ID dan Auto-Renewal ke jadual Subscriptions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='project_id') THEN
        ALTER TABLE subscriptions ADD COLUMN project_id UUID REFERENCES projects(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='cancel_at_period_end') THEN
        ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Benarkan plan_name dan status menjadi null buat sementara semasa sesi checkout dimulakan
ALTER TABLE subscriptions ALTER COLUMN stripe_sub_id DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN current_period_end DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN plan_name DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN status DROP NOT NULL;
