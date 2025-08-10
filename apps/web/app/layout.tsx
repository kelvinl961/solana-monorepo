import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solana Block Explorer (Lite)",
  description: "Type a slot to see transaction count and metadata",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const toggleTheme = () => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('light');
    }
  };
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Solana Block Explorer (Lite)</h1>
          <div className="flex items-center gap-3">
            <button className="btn-secondary" onClick={toggleTheme} type="button">Toggle theme</button>
            <div className="badge">alpha</div>
          </div>
        </header>
        <main className="px-6 pb-10 max-w-3xl mx-auto">
          {children}
        </main>
        <footer className="px-6 py-6 text-sm text-[var(--sol-muted)]">
          Built with Next.js + NestJS • Data via Solana RPC
        </footer>
      </body>
    </html>
  );
}
