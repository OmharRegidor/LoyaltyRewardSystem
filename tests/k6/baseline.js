// k6 baseline test — establishes p50/p90/p99 latency benchmarks
// Run: k6 run tests/k6/baseline.js
// Requires: K6_SUPABASE_URL, K6_SUPABASE_ANON_KEY, K6_TEST_TOKEN env vars

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.K6_SUPABASE_URL || "http://localhost:3000";
const ANON_KEY = __ENV.K6_SUPABASE_ANON_KEY || "";
const AUTH_TOKEN = __ENV.K6_TEST_TOKEN || "";

export const options = {
  vus: 50,
  duration: "2m",
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.01"],
  },
};

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${AUTH_TOKEN}`,
  apikey: ANON_KEY,
};

export default function () {
  // 1. Fetch rewards catalog
  const rewardsRes = http.get(`${BASE_URL}/rest/v1/rewards?is_active=eq.true&limit=10`, { headers });
  check(rewardsRes, { "rewards 200": (r) => r.status === 200 });

  // 2. Fetch customer points balance
  const pointsRes = http.get(`${BASE_URL}/rest/v1/customer_businesses?select=points&limit=5`, { headers });
  check(pointsRes, { "points 200": (r) => r.status === 200 });

  // 3. Fetch recent transactions
  const txRes = http.get(`${BASE_URL}/rest/v1/transactions?order=created_at.desc&limit=10`, { headers });
  check(txRes, { "transactions 200": (r) => r.status === 200 });

  sleep(1);
}
