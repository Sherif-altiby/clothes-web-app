
import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'http://localhost:8000';

export const options = {
  vus: 1,
  iterations: 1000,

  thresholds: {
    http_req_failed: ['rate==0'],
    checks: ['rate==1'],
  },
};

export default function () {
  const res = http.get(
    `${BASE_URL}/api/user/products?limit=10&page=1&orderPrice=desc`
  );

  let data;

  try {
    data = res.json();
  } catch (_) {
    data = null;
  }

  check(res, {
    'status is 200': (r) => r.status === 200,

    'response is JSON': (r) =>
      r.headers['Content-Type']?.includes('application/json'),

    'response body is not empty': (r) =>
      r.body !== null && r.body.length > 0,

    'response contains products data': () =>
      data !== null && typeof data === 'object',

    'request completes within 500ms': (r) =>
      r.timings.duration < 500,
  });
}
