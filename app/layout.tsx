import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Store | Shop Online",
  description: "Browse products and order directly through WhatsApp."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
