import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "SIGAP BERAU — Sistem Pembinaan Statistik Sektoral Terintegrasi | BPS Kabupaten Berau",
  description:
    "Portal Sistem Pembinaan Statistik Sektoral yang Terintegrasi untuk Akselerasi Pembangunan Kabupaten Berau (Badan Pusat Statistik Kabupaten Berau).",
  icons: {
    icon: "/assets/logo-sigap-emblem.jpg",
    apple: "/assets/logo-sigap-emblem.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontMono.variable
        )}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          enableColorScheme={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
