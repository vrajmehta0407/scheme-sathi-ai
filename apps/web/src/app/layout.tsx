import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SchemeSathi AI — Generative AI Government Scheme Eligibility Assistant',
  description: 'Discover central and Gujarat government welfare schemes tailored to your profile. Understand eligibility criteria, inspect document checklists, and apply via official portals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}

