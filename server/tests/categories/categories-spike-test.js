
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "10s", target: 150 },
    { duration: "1m", target: 150 },
    { duration: "10s", target: 5 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    checks: ["rate>0.90"],
    http_req_failed: ["rate<0.10"],
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/user/categories`, {
    headers: { Accept: "application/json" },
    timeout: "10s",
  });

  let body;
  try {
    body = res.json();
  } catch {
    body = null;
  }

  check(res, {
    "status is 200": (r) => r.status === 200,
    "success is true": () => body?.success === true,
    "categories data exists": () => body?.data !== undefined,
  });

  sleep(0.5);
}
