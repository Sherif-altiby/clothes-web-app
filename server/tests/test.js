
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:8000';

export const options = {
  stages: [
    { duration: '2m', target: 10000 }, // Ramp up to 10,000 VUs
    { duration: '1m', target: 10000 }, // Hold 10,000 VUs
    { duration: '1m', target: 0 },     // Ramp down
  ],

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const res = http.get(
    `${BASE_URL}/api/user/products?limit=10&page=1&orderPrice=desc`
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has body': (r) => r.body && r.body.length > 0,
  });

  sleep(1);
}
