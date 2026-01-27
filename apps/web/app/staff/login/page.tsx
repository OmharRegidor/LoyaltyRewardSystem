// apps/web/app/staff/login/page.tsx
// Redirect staff to main login - unified login experience

import { redirect } from 'next/navigation';

export default function StaffLoginPage() {
  redirect('/login');
}
