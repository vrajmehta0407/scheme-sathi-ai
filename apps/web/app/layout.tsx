import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/glass/Providers';
import { JaaliBackdrop } from '@/components/glass/JaaliBackdrop';
import { BlobCursor } from '@/components/glass/BlobCursor';
import { AppShell } from '@/components/glass/AppShell';

export const metadata: Metadata = {
  title: 'Scheme Sathi AI — Every Scheme You Deserve, Found in 2 Minutes',
  description:
    'Offline-ready Indian welfare scheme finder, eligibility explainer, document wallet, and policy analytics workbench. Zero API keys.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-mist text-ink antialiased">
        <Providers>
          <JaaliBackdrop />
          <BlobCursor />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

