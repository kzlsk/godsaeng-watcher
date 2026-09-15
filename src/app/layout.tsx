import type { Metadata } from "next";
import { Inter, Black_Han_Sans } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const blackHanSans = Black_Han_Sans({
  variable: "--font-black-han-sans",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "갓생 감시자",
  description: "할 일 · 마감 · 실제 실행 데이터를 근거로 AI가 쓴소리를 던지는 갓생 관리 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${inter.variable} ${blackHanSans.variable}`}>
      <body className="min-h-screen bg-surface font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
