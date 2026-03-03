// k6 stress test — ramp up to find breaking point
// Run: k6 run tests/k6/stress.js

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.K6_SUPABASE_URL || "http://localhost:3000";
const ANON_KEY = __ENV.K6_SUPABASE_ANON_KEY || "";
const AUTH_TOKEN = __ENV.K6_TEST_TOKEN || "";

export const options = {
  stages: [
    { duration: "1m", target: 100 },
    { duration: "3m", target: 500 },
    { duration: "3m", target: 1000 },
    { duration: "2m", target: 500 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
  },
};

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${AUTH_TOKEN}`,
  apikey: ANON_KEY,
};

export default function () {
  const rewardsRes = http.get(`${BASE_URL}/rest/v1/rewards?is_active=eq.true&limit=10`, { headers });
  check(rewardsRes, { "rewards ok": (r) => r.status === 200 });

  const txRes = http.get(`${BASE_URL}/rest/v1/transactions?order=created_at.desc&limit=10`, { headers });
  check(txRes, { "transactions ok": (r) => r.status === 200 });

  sleep(0.5);
}
