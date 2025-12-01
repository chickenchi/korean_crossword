import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "한국어 십자말풀이",
  description: "자동 십자말풀이 생성 프로젝트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
