import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlightPlus - 全球機票比價",
  description: "透過 Travelpayouts API 整合，打造全球機票比價平台，幫助用戶找到最划算的出行方案",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">{children}</body>
    </html>
  );
}