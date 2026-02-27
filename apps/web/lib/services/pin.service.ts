// apps/web/lib/services/pin.service.ts

import bcrypt from 'bcryptjs';

export const PIN_MAX_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
