import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";

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
        <AuthProvider>
          <Navbar />
          <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
