// k6 spike test — simulates sudden traffic burst (campaign launch)
// Run: k6 run tests/k6/spike.js

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.K6_SUPABASE_URL || "http://localhost:3000";
const ANON_KEY = __ENV.K6_SUPABASE_ANON_KEY || "";
const AUTH_TOKEN = __ENV.K6_TEST_TOKEN || "";

export const options = {
  stages: [
    { duration: "10s", target: 1000 },
    { duration: "30s", target: 1000 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<3000"],
    http_req_failed: ["rate<0.10"],
  },
};

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${AUTH_TOKEN}`,
  apikey: ANON_KEY,
};

export default function () {
  const res = http.get(`${BASE_URL}/rest/v1/rewards?is_active=eq.true&limit=10`, { headers });
  check(res, { "spike ok": (r) => r.status === 200 || r.status === 429 });
  sleep(0.3);
}
