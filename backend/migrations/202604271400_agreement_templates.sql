-- Agreement Templates for OTP and SaaS
INSERT INTO system_settings (key, value) VALUES
    ('agreement_template_otp', '[
        {
            "title": "SKOP KERJA & TEKNOLOGI",
            "content": "- **Jenis Projek:** {{project_name}}\n- **Teknologi:** Laravel/Axum (Backend) dan Next Js (Frontend).\n- **Tempoh Pembangunan:** 30 hari bekerja bermula dari tarikh bayaran deposit diterima dan disahkan."
        },
        {
            "title": "STRUKTUR PEMBAYARAN (ONE-OFF)",
            "content": "**Total Kos Projek: RM {{total_cost}}**\n\n- **Deposit (30%):** RM {{deposit_amount}} – Dibayar sebelum kerja dimulakan.\n- **Baki Akhir (70%):** RM {{balance_amount}} – Dibayar selepas projek siap, diuji (UAT), dan sebelum penyerahan akses penuh (Go-Live)."
        },
        {
            "title": "PINDAAN (REVISIONS)",
            "content": "Semasa Pembangunan: Pelanggan berhak mendapat pindaan tanpa had secara percuma selagi tidak lari dari skop asal.\n\nSekiranya tempoh 30 hari pembangunan asal telah tamat, sebarang permintaan penambahan atau perubahan ciri (feature) baru akan dikenakan cas mengikut skala berikut:\n\n- **Small Change Request:** RM50.00 - RM200.00 per permintaan.\n- **Medium Change Request:** RM200.00 - RM500.00 per permintaan.\n- **Large Change Request:** RM500.00 - RM1,500.00 per permintaan."
        },
        {
            "title": "PEMILIKAN KOD & HAK CIPTA (OWNERSHIP)",
            "content": "- **Penyerahan Hak:** Setelah bayaran penuh dijelaskan, segala Hak Milik Mutlak ke atas kod sumber (source code) dan aset digital akan diserahkan kepada Pelanggan.\n- **Penyimpanan:** Penyedia Perkhidmatan tidak bertanggungjawab menyimpan salinan kod selepas penyerahan dilakukan."
        },
        {
            "title": "DOMAIN, HOSTING & PENYELENGGARAAN",
            "content": "- **Tanggungjawab Pelanggan:** Kos tahunan bagi Nama Domain dan Server/Hosting adalah tanggungan Pelanggan sepenuhnya.\n- **Sokongan Teknikal (Warranty):** Penyedia Perkhidmatan menyediakan sokongan teknik percuma selama 90 hari selepas projek tamat bagi membaiki ralat (bugs) sahaja."
        },
        {
            "title": "HAD LIABILITI",
            "content": "Penyedia Perkhidmatan tidak bertanggungjawab ke atas sebarang kerugian keuntungan atau gangguan perniagaan yang disebabkan oleh masalah teknikal pihak ketiga (contoh: gangguan server, API sistem pembayaran, atau gangguan internet global)."
        }
    ]'),
    ('agreement_template_saas', '[
        {
            "title": "SKOP KERJA & TEKNOLOGI",
            "content": "- **Jenis Projek:** {{project_name}}\n- **Teknologi:** Laravel/Axum (Backend) dan Next Js (Frontend).\n- **Tempoh Pembangunan:** 30 hari bekerja bermula dari tarikh bayaran pertama diterima dan disahkan."
        },
        {
            "title": "MODEL PEMBAYARAN & FASA PEMBANGUNAN",
            "content": "- **Bayaran Pendahuluan:** Pelanggan wajib mula melanggan sebelum fasa pembangunan dimulakan.\n- **Fasa Pembangunan:** Pembangunan website hanya akan dimulakan secara rasmi selepas bayaran bulan pertama berjaya disahkan melalui sistem.\n- **Unlimited Revisions:** Dalam tempoh 30 hari pembangunan, Pelanggan berhak meminta pindaan atau penambahan ciri (feature) tanpa had dan tanpa cas tambahan selagi tidak mengubah struktur/kategori asal projek yang telah dipersetujui."
        },
        {
            "title": "YURAN LANGGANAN & PENYELENGGARAAN (SAAS)",
            "content": "- **Yuran Bulanan:** **RM {{deposit_amount}}** sebulan (Auto-billing melalui sistem Stripe).\n- **Merangkumi:** Sewaan Server (VPS), Nama Domain, Sijil SSL (Security), Penyelenggaraan Sistem, dan Pemantauan Keselamatan.\n- **Jaminan Ralat (Bugs):** Penyedia Perkhidmatan bertanggungjawab sepenuhnya ke atas pembetulan ralat teknikal (bugs) tanpa sebarang cas tambahan dan tanpa had tempoh selagi langganan masih aktif."
        },
        {
            "title": "PINDAAN SELEPAS TEMPOH PEMBANGUNAN (CHANGE REQUEST)",
            "content": "Sekiranya tempoh 30 hari pembangunan asal telah tamat, sebarang permintaan penambahan atau perubahan ciri (feature) baru akan dikenakan cas mengikut skala berikut:\n\n- **Small Change Request:** RM50.00 - RM200.00 per permintaan.\n- **Medium Change Request:** RM200.00 - RM500.00 per permintaan.\n- **Large Change Request:** RM500.00 - RM1,500.00 per permintaan."
        },
        {
            "title": "PEMILIKAN KOD & DATA (PROPRIETARY RIGHTS)",
            "content": "- **Pemilikan Kod:** Segala kod sumber (source code), reka bentuk sistem, dan logik pengaturcaraan adalah **HAK MILIK MUTLAK** Penyedia Perkhidmatan. Pelanggan dikira menyewa sistem/laman web tersebut sepanjang tempoh langganan aktif.\n- **Data Pelanggan:** Segala data perniagaan, maklumat pelanggan, dan pangkalan data jualan adalah hak milik penuh Pelanggan."
        },
        {
            "title": "PEMBATALAN & PENANGGUHAN AKSES",
            "content": "- **Kegagalan Bayaran:** Sekiranya langganan bulanan gagal dijelaskan pada tarikh matang, akses laman web akan digantung (suspend) secara automatik sehingga bayaran tunggakan diselesaikan.\n- **Penamatan:** Pelanggan berhak menamatkan langganan/sewaan pada bila-bila masa tanpa sebarang notis. Pelanggan bertanggungjawab untuk mematikan fungsi auto-billing di dalam portal pelanggan bagi menghentikan caj masa hadapan."
        },
        {
            "title": "HAD LIABILITI",
            "content": "Penyedia Perkhidmatan tidak bertanggungjawab ke atas sebarang kerugian keuntungan atau gangguan perniagaan yang disebabkan oleh masalah teknikal pihak ketiga (contoh: gangguan server, API sistem pembayaran, atau gangguan internet global)."
        }
    ]')
ON CONFLICT (key) DO NOTHING;
