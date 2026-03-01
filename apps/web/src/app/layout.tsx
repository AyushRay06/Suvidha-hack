import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n/provider";
import { DynamicHtmlLang } from "@/components/shared/DynamicHtmlLang";
import { AccessibilityProvider } from "@/lib/context/accessibility";
import { AccessibilityToolbar } from "@/components/kiosk/AccessibilityToolbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SUVIDHA Kiosk - Unified Civic Services",
  description: "Self-service kiosk for Electricity, Gas, Water, and Municipal services",
  keywords: ["civic services", "kiosk", "smart city", "electricity", "water", "gas", "municipal"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <I18nProvider>
          <AccessibilityProvider>
            <DynamicHtmlLang />
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <nav aria-label="Skip navigation" className="sr-only">
              <a href="#main-content">Skip to main content</a>
            </nav>
            <main id="main-content">
              {children}
            </main>
            <div aria-live="polite" aria-atomic="true">
              <Toaster />
            </div>
            <AccessibilityToolbar />
          </AccessibilityProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
