# 🗺️ SaaS House - Peta Jalan (Roadmap)

| Kategori | Ciri-Ciri | Status | Nota |
| :--- | :--- | :---: | :--- |
| **Infrastruktur** | Penskalaan Menegak (RAM Limits) | ✅ | Docker dihadkan maksimum 4GB RAM. |
| | Penskalaan Mendatar (Nginx Proxy) | ✅ | Frontend menggunakan 2 replika. |
| | **Redis Queue (Message Broker)** | ✅ | Stripe, ToyyibPay & Notifikasi (Gred Enterprise). |
| **Pangkalan Data** | Database Indexing (Prestasi) | ✅ | Ruangan status & FK telah diindeks. |
| | Atomic Transactions | ✅ | Memastikan ketekalan data merentasi jadual. |
| **Sekuriti** | 2FA Admin (OTP) | ✅ | Aliran log masuk selamat untuk pentadbir. |
| | Rate Limiting | ✅ | Perlindungan Brute-force melalui Redis. |
| | CSRF Protection | ✅ | Perlindungan lalai terhadap serangan Cross-site. |
| | **Cloudflare Turnstile (Anti-Bot)** | ✅ | Diintegrasikan penuh pada borang Log Masuk & Daftar. |
| **Ciri-Ciri Utama** | Bilik Menunggu (Waiting Room) | ✅ | Cloudflare Worker + Upstash Redis (Edge). |
| | Mod Penyelenggaraan (Maintenance) | ✅ | Proses 'polling' dan auto-redirect telah dioptimumkan. |
| | Billing System (Stripe/ToyyibPay) | ✅ | Webhook diletakkan pada Background Queue (Sangat Stabil). |
| | Carian Domain (Ketepatan) | ✅ | Carian lansung bebas ralat rangkaian (Tanpa Cache). |
| | Perjanjian Servis (Agreement) | ✅ | Tandatangan digital dan templat dinamik sedia ada. |
| | **Komunikasi Real-time (Admin-Client)** | ✅ | Integrasi Chat Ticket bersama Unit Test (Lulus). |

---
**Legenda Status:**
- ✅ : Berfungsi Cemerlang & Selesai Diuji
- ⚠️ : Dalam Pembaikan / Penambahbaikan
- 🔴 : Tergendala / Ralat Kritikal
