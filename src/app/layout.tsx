import type { Metadata } from "next";
import { QueryProvider } from "../providers";
import { Toaster } from "@/components/ui/sonner";
import { barlow, siteConfig } from "@/config";
import "./globals.css";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <body className={barlow.className} style={{ fontFamily: barlow.style.fontFamily }}>
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
