-- 202604060001: Tambah 'PAYMENT_PENDING' ke dalam enum project_status
-- Ini diperlukan untuk membolehkan migrasi 202604131600 berjalan dengan betul pada pangkalan data bersih.

ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'PAYMENT_PENDING' AFTER 'ONBOARDING';
