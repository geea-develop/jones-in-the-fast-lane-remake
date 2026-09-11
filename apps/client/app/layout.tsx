import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Analytics from "@/components/Analytics";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

// Self-hosted retro font — bundled locally so the app needs no external font
// CDN and works fully offline. (OFL-licensed Press Start 2P.)
const pressStart2P = localFont({
  src: "./fonts/PressStart2P-Regular.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Jones in the Fast Lane",
  description: "A modern remake of the classic 1991 Sierra DOS game",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#101a2c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID?.slice(0, 7) || "local";
  const serverUrl = process.env.NEXT_PUBLIC_API_URL || "https://jones-server.onrender.com";

  const isDev = process.env.NODE_ENV === "development";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    `connect-src 'self' https://cloudflareinsights.com ${serverUrl}${isDev ? " http://localhost:3001" : ""}`,
    "font-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join("; ") + ";";

  return (
    <html lang="en" className={pressStart2P.variable}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
        <link rel="manifest" href={`${basePath}/manifest.webmanifest`} />
        <link rel="apple-touch-icon" href={`${basePath}/icon-192.png`} />
      </head>
      <body className="bg-gray-900 text-white min-h-screen">
        {children}
        <footer className="fixed bottom-2 right-3 flex items-center gap-2 z-10 opacity-50 hover:opacity-100 transition-opacity">
          <a
            href="https://github.com/geea-develop/jones-in-the-fast-lane-remake/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300 text-[10px] underline"
          >
            Report Bug
          </a>
          <span className="text-gray-700 text-[10px]">
            {buildId} 🏃
          </span>
        </footer>
        <Analytics />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
