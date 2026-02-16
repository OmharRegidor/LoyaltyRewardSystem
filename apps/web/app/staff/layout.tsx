import ServerRestricted from '@/components/auth/ServerRestricted';
import AccessDenied from '@/components/auth/AccessDenied';

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServerRestricted allowedRoles={['staff']} fallback={<AccessDenied />}>
      {children}
    </ServerRestricted>
  );
}
