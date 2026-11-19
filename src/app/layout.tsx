import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sona Scheduler — Remedial Class Management System | Sona College of Technology',
  description: 'Academic arrear management, remedial class scheduling, peer tutor allocation, and attendance tracking system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
