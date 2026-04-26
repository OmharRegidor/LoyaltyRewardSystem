// apps/web/lib/impersonation-client.ts
// Client-safe constants shared with the server-only impersonation module.

export const IMPERSONATION_COOKIE_NAME = 'noxa_impersonation';
export const IMPERSONATION_DISPLAY_COOKIE_NAME = 'noxa_impersonation_target';
export const IMPERSONATION_MODE_COOKIE_NAME = 'noxa_impersonation_mode';

export type ImpersonationMode = 'read_only' | 'edit';
