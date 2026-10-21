
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:8000';

export const options = {
  vus: 1,
  iterations: 250,
  thresholds: {
    http_req_failed: ['rate==0'],
    checks: ['rate==1'],
  },
};

const testCases = [
  { page: 1, limit: 5, orderPrice: 'asc' },
  { page: 2, limit: 5, orderPrice: 'asc' },
  { page: 1, limit: 10, orderPrice: 'desc' },
  { page: 2, limit: 10, orderPrice: 'desc' },
];

export default function () {
  for (const testCase of testCases) {
    const url =
      `${BASE_URL}/api/user/products` +
      `?limit=${testCase.limit}` +
      `&page=${testCase.page}` +
      `&orderPrice=${testCase.orderPrice}`;

    const res = http.get(url);

    let data = null;

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
      'response contains a JSON object or array': () =>
        data !== null && typeof data === 'object',
      'response time is below 500ms': (r) =>
        r.timings.duration < 500,
    });

    sleep(0.1);
  }
}
