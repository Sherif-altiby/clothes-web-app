
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";

export const options = {
  stages: [
    { duration: "1m", target: 20 },
    { duration: "30m", target: 20 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
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

  sleep(1);
}
