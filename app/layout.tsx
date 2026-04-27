import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppFooter } from "@/components/layout/AppFooter";

export const metadata: Metadata = {
  title: "ATD26_SCIENCE-ART",
  description: "Journal of AR & 3D Specimens",
  appleWebApp: {
    capable: true,
    title: "ATD26",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
        <AppFooter />
      </body>
    </html>
  );
}
