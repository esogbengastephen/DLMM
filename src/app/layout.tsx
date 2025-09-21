import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletContextProvider } from '@/contexts/WalletContextProvider';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { Navigation } from '@/components/Navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
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
  title: "DLMM Cockpit",
  description: "Real-time DLMM liquidity management and trading dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <WalletContextProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Navigation />
              <div className="bg-card-background border-b border-border px-4 sm:px-6 lg:px-8 py-3">
                <div className="max-w-7xl mx-auto">
                  <Breadcrumb />
                </div>
              </div>
              <main className="flex-1">
                {children}
              </main>
            </div>
          </WalletContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
