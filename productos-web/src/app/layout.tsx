import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "ProductOS — Product Decision Intelligence Platform",
  description: "The AI-First operations and memory layer for product teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full flex flex-col bg-[#090B11] text-[#F1F5F9] antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
