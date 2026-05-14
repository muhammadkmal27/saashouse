# 🧪 Rekod Pembangunan & Ujian Unit (Features)

Fail ini menyimpan rekod granular bagi setiap pelaksanaan logik perniagaan, komponen UI, dan integrasi API berserta status kelulusan (Test/Verification).

## 🔐 Modul Keselamatan (Security & Auth)
- `[x]` Implementasi laluan `/api/auth/login` (Backend).
- `[x]` Implementasi laluan `/api/auth/register` (Backend).
- `[x]` Perlindungan CSRF pada borang sensitif.
- `[x]` Logik pengesahan 2FA untuk akaun Admin.
- `[x]` Implementasi utiliti `verify_turnstile()` menggunakan Reqwest (Rust).
- `[x]` Pemintasan Cloudflare Turnstile pada borang Log Masuk (Frontend).
- `[x]` Pemintasan Cloudflare Turnstile pada borang Pendaftaran (Frontend).
- `[x]` Penghantaran Turnstile Site Key melalui Docker `build-args` di GitHub Actions.

## 💳 Modul Pengebilan (Billing & Onboarding)
- `[x]` Logik harga dinamik pelan SaaS.
- `[x]` Penjanaan Invois Stripe secara automatik.
- `[x]` Laluan *Webhook* Stripe (`/api/webhooks/stripe`).
- `[x]` Integrasi Gerbang Pembayaran ToyyibPay untuk deposit/OTP.
- `[x]` Laluan *Webhook* ToyyibPay (`/api/webhooks/toyyibpay`).

## 💬 Modul Komunikasi (Chat & Support)
- `[x]` Fungsi cipta tiket bantuan baru.
- `[x]` Antaramuka pembalasan Chat interaktif (Real-time).
- `[x]` Pemfailan dokumen Service Agreement digital (PDF/UI).
- `[x]` Pemintasan Cloudflare Turnstile pada borang Contact (Frontend & Backend).

## 🚀 Infrastruktur & Operasi (Ops)
- `[x]` Konfigurasi Docker Compose untuk Nginx, Redis, Postgres.
- `[x]` CI/CD Pipeline melalui GitHub Actions (Deploy to GHCR).
- `[x]` Pengurusan Queue menggunakan Redis Background Worker.

---
*Nota Pembangun: Sila tandakan `[x]` setiap kali fungsi siap dibina dan melepasi proses pengujian setempat (Local Test).*
