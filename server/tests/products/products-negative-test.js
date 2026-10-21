
import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'http://localhost:8000';


export const options = {
  vus: 1,
  iterations: 10,
  thresholds: {
    checks: ['rate==1'],
  },
};


const testCases = [
  {
    name: 'valid pagination',
    query: 'page=1&limit=10',
    expectedStatus: 200,
  },
  {
    name: 'page zero',
    query: 'page=0&limit=10',
    expectedStatus: 400,
  },
  {
    name: 'negative page',
    query: 'page=-1&limit=10',
    expectedStatus: 400,
  },
  {
    name: 'negative limit',
    query: 'page=1&limit=-1',
    expectedStatus: 400,
  },
  {
    name: 'invalid page value',
    query: 'page=abc&limit=10',
    expectedStatus: 400,
  },
  {
    name: 'invalid limit value',
    query: 'page=1&limit=abc',
    expectedStatus: 400,
  },
];

export default function () {
  for (const testCase of testCases) {
    const url =
      `${BASE_URL}/api/user/products?${testCase.query}`;

    const res = http.get(url);

    check(res, {
      [`${testCase.name}: expected status`]: (r) =>
        r.status === testCase.expectedStatus,
      [`${testCase.name}: response is not empty`]: (r) =>
        r.body !== null && r.body.length > 0,
    });
  }
}
