import { APP_NAME } from "@/lib/app";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Aplikasi kasir dan pencatatan pesanan jasa titip",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
