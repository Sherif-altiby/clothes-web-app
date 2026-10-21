
import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";

export const options = {
  vus: 1,
  iterations: 1000,
  thresholds: {
    checks: ["rate==1"],
    http_req_failed: ["rate==0"],
    http_req_duration: ["p(95)<500"],
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
    "response is JSON": (r) =>
      r.headers["Content-Type"]?.includes("application/json"),
    "success is true": () => body?.success === true,
    "categories data exists": () => body?.data !== undefined,
  });
}
