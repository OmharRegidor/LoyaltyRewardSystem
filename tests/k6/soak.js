// k6 soak test — sustained load for connection leak detection
// Run: k6 run tests/k6/soak.js

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.K6_SUPABASE_URL || "http://localhost:3000";
const ANON_KEY = __ENV.K6_SUPABASE_ANON_KEY || "";
const AUTH_TOKEN = __ENV.K6_TEST_TOKEN || "";

export const options = {
  vus: 200,
  duration: "15m",
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
    http_req_failed: ["rate<0.02"],
  },
};

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${AUTH_TOKEN}`,
  apikey: ANON_KEY,
};

export default function () {
  // Mix of read operations
  const scenario = Math.random();

  if (scenario < 0.4) {
    const res = http.get(`${BASE_URL}/rest/v1/rewards?is_active=eq.true&limit=10`, { headers });
    check(res, { "rewards ok": (r) => r.status === 200 });
  } else if (scenario < 0.7) {
    const res = http.get(`${BASE_URL}/rest/v1/transactions?order=created_at.desc&limit=10`, { headers });
    check(res, { "transactions ok": (r) => r.status === 200 });
  } else {
    const res = http.get(`${BASE_URL}/rest/v1/customer_businesses?select=points&limit=5`, { headers });
    check(res, { "points ok": (r) => r.status === 200 });
  }

  sleep(1);
}
