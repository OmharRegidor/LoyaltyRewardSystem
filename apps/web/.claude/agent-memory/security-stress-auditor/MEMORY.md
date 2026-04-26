# Web Security Auditor Memory

## Stamp Card Audit (2026-04-01)
- CRITICAL: `/api/staff/stamp/*` routes accept staffId/businessId from body without server-side verification
- CRITICAL: Stamp RPCs lack FOR UPDATE locks (TOCTOU race)
- HIGH: Stamp mutation RPCs granted to `authenticated` role, not just `service_role`
- HIGH: No plan/feature-gate check on stamp endpoints (Enterprise-only feature accessible to free)
- Pattern: POS sale route (`verifyStaffAndGetBusiness`) is the correct auth model for staff routes
