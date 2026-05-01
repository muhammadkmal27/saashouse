-- 202605011800: Tambah tetapan saas_deposit_price ke dalam system_settings
INSERT INTO system_settings (key, value, updated_at)
VALUES ('saas_deposit_price', '250.00', NOW())
ON CONFLICT (key) DO NOTHING;
