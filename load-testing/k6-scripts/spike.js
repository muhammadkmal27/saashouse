import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi Spike Test: Ujian Mengejut (Viral) - 10000 Pengguna
export const options = {
  stages:
    [
      { duration: '10s', target: 1000 },   // Permulaan pantas
      { duration: '20s', target: 10000 },  // LONJAKAN MENGEJUT (VIRAL) KE 10000!
      { duration: '30s', target: 10000 },  // Tahan beban viral 10000 VUs
      { duration: '10s', target: 0 },     // Turun semula
    ],
  thresholds: {
    // Tiada fail-safe untuk error kerana kita jangkakan 401 dari backend
  },
};

const BASE_URL = 'http://host.docker.internal:8080';

export default function () {
  const res = http.get(`${BASE_URL}/api/admin/stats`);
  
  check(res, {
    'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  
  sleep(1);
}
