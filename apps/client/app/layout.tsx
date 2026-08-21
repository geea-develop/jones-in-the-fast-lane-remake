import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jones in the Fast Lane",
  description: "A modern remake of the classic 1991 Sierra DOS game",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">{children}</body>
    </html>
  );
}
