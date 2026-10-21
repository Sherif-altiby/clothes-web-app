
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 500 },   // Baseline
    { duration: "10s", target: 1000 }, // Sudden spike
    { duration: "1m", target: 1000 },  // Hold the spike
    { duration: "10s", target: 500 },   // Drop the load
    { duration: "30s", target: 0 },   // Recovery
  ],

  thresholds: {
    checks: ["rate>0.95"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

const BASE_URL = "http://localhost:8000";

export default function () {
  const response = http.get(
    `${BASE_URL}/api/user/products?limit=10&page=1`,
    {
      headers: {
        Accept: "application/json",
      },
      tags: {
        endpoint: "products",
        test_type: "spike",
      },
      timeout: "10s",
    }
  );

  let json;

  try {
    json = response.json();
  } catch {
    json = null;
  }

  check(response, {
    "status is 200": (res) => res.status === 200,
    "response is JSON": (res) =>
      res.headers["Content-Type"]?.includes("application/json"),
    "success is true": () => json?.success === true,
    "products data exists": () => json?.data !== undefined,
    "response under 1 second": (res) => res.timings.duration < 1000,
  });

  sleep(0.1);
}
