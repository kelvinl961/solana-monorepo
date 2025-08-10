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
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Solana Block Explorer (Kelvin)</h1>
         
        </header>
        <main className="px-6 pb-10 max-w-3xl mx-auto">
          {children}
        </main>
      
      </body>
    </html>
  );
}
