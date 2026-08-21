import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jones in the Fast Lane",
  description: "A modern remake of the classic 1991 Sierra DOS game",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID?.slice(0, 7) || "local";
  const serverUrl = process.env.NEXT_PUBLIC_API_URL || "https://jones-server.onrender.com";

  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    `connect-src 'self' https://cloudflareinsights.com ${serverUrl}${isDev ? " http://localhost:3001" : ""}`,
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join("; ") + ";";

  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
      </head>
      <body className="bg-gray-900 text-white min-h-screen">
        {children}
        <footer className="fixed bottom-4 left-0 right-0 flex flex-col items-center gap-2 z-10">
          <a
            href="https://github.com/geea-develop/jones-in-the-fast-lane-remake/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300 text-xs underline"
          >
            Report Bug
          </a>
          <span className="text-gray-700 text-[10px]">
            build {buildId} 🏃
          </span>
        </footer>
        <script
          type="module"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "CLOUDFLARE_TOKEN_HERE"}'
        />
      </body>
    </html>
  );
}
