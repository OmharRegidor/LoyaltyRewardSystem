import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Call - NoxaLoyalty',
  description: 'Schedule a demo to learn about NoxaLoyalty Enterprise features',
};

export default function BookCallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
