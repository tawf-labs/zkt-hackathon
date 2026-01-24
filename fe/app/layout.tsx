// app/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WalletProvider } from "@/components/providers/web3-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { SearchProvider } from "@/components/shared/SearchContext";

export const metadata: Metadata = {
  title: "zkt.app - Transparent and Traceable donation",
  description: "Private, verifiable Zakat with ZK proofs",
  generator: "v0.app",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <LanguageProvider>
            <WalletProvider>
                <CurrencyProvider>
                  <SearchProvider>
                    <Header />
                    <Suspense fallback={null}>{children}</Suspense>
                    <Footer />
                    <Toaster />
                  </SearchProvider>
                </CurrencyProvider>
            </WalletProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
