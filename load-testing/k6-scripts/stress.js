import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi Stress Test: Menguji Had Maksimum
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Fasa 1: Trafik Normal
    { duration: '30s', target: 150 }, // Fasa 2: Mula menekan
    { duration: '1m', target: 300 },  // Fasa 3: Beban Tinggi (Stress)
    { duration: '30s', target: 0 },   // Fasa Penyejukan
  ],
  thresholds: {
    // FAIL-SAFE: HENTIKAN UJIAN JIKA SISTEM TERLALU LAMBAT (OVERHEATING PREVETION)
    http_req_duration: [
      {
        threshold: 'p(95)<2000', // 95% request mesti siap bawah 2 saat
        abortOnFail: true,       // Batal ujian serta-merta jika melebihi ambang ini
        delayAbortEval: '10s',   // Beri masa 10 saat pada awal ujian sebelum menilai batal
      },
    ],
    // FAIL-SAFE TAMBAHAN: Kadar Kegagalan tidak disemak di sini kerana kita sengaja menjana 401 Unauthorized.
  },
};

const BASE_URL = 'http://host.docker.internal:3000';

export default function () {
  // Kita tembak Load Balancer Nginx yang mengawal 5 kontena Next.js
  const res = http.get(`${BASE_URL}/`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
