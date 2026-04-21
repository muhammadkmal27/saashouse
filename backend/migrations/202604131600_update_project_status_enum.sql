-- 202604131600: Tambah Status PAID dan UNDER_DEVELOPMENT ke dalam enum project_status
-- Nota: PostgreSQL tidak membenarkan ALTER TYPE ADD VALUE dilakukan di dalam blok transaksi jika ia sudah digunakan.

-- Tambah PAID selepas PAYMENT_PENDING
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'PAID' AFTER 'PAYMENT_PENDING';

-- Tambah UNDER_DEVELOPMENT selepas PAID
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'UNDER_DEVELOPMENT' AFTER 'PAID';
