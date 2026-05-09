import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi Load Test: Trafik Normal
export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Naik ke 50 pengguna dalam 30 saat
    { duration: '1m', target: 50 },  // Kekal 50 pengguna selama 1 minit
    { duration: '30s', target: 0 },  // Turun balik ke 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% request mesti bawah 2 saat
  },
};

const BASE_URL = 'http://host.docker.internal:3000';

export default function () {
  const res = http.get(`${BASE_URL}/`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
