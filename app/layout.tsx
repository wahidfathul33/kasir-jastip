import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kasir Jastip",
  description: "Aplikasi kasir dan pencatatan pesanan jasa titip",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
