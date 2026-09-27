import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: {
    default: 'FlowPilot — Turn opportunities into organized work',
    template: '%s | FlowPilot',
  },
  description:
    'AI-powered opportunity, workflow, and task management platform for small businesses and content creators.',
  keywords: ['CRM', 'workflow', 'task management', 'AI', 'opportunities', 'creator', 'business'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
