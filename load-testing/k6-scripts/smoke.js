import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi Smoke Test: Minimal load
export const options = {
  vus: 1, // 1 Virtual User
  duration: '10s', // Uji selama 10 saat sahaja
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% request mesti respons bawah 1.5 saat
  },
};

const BASE_URL = 'http://host.docker.internal:3000';

export default function () {
  const res = http.get(`${BASE_URL}/`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'homepage loaded': (r) => r.body.includes('<html'),
  });
  
  sleep(1);
}
