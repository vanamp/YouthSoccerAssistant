import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Youth Soccer Assistant",
  description: "Advanced AI-powered youth soccer lineup generator and manager.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
            <span style={{ color: 'var(--primary)' }}>YSA</span> Lineups
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 500 }}>
            <Link href="/roster" style={{ transition: 'color var(--transition-fast)' }}>Roster</Link>
            <Link href="/setup" style={{ transition: 'color var(--transition-fast)' }}>Game Setup</Link>
          </div>
        </nav>
        <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
