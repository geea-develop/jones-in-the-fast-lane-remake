// Minimal static file server for the exported client (`out/`).
//
// The client is a Next.js static export (`output: "export"`), so `next start`
// is unavailable. Playwright's `webServer` uses this script to serve the built
// artifacts for the geometry property/e2e tests. Dependency-free on purpose:
// it only relies on Node's built-in `http`/`fs` modules so no extra package is
// pulled into the workspace.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "out");
const PORT = Number(process.env.PORT || 4321);
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

/** Resolve a request URL path to a file inside OUT_DIR, guarding against traversal. */
function resolveRequestPath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  // Prevent path traversal outside OUT_DIR.
  const safe = normalize(clean).replace(/^(\.\.(\/|\\|$))+/, "");
  return join(OUT_DIR, safe);
}

async function resolveFile(candidate) {
  try {
    const info = await stat(candidate);
    if (info.isDirectory()) {
      return resolveFile(join(candidate, "index.html"));
    }
    return candidate;
  } catch {
    // Static export writes `route.html` for each route.
    if (extname(candidate) === "") {
      try {
        const htmlCandidate = `${candidate}.html`;
        await stat(htmlCandidate);
        return htmlCandidate;
      } catch {
        return null;
      }
    }
    return null;
  }
}

const server = createServer(async (req, res) => {
  const requestedPath = resolveRequestPath(req.url || "/");
  if (!requestedPath.startsWith(OUT_DIR + sep) && requestedPath !== OUT_DIR) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  let filePath = await resolveFile(requestedPath);
  if (!filePath) {
    // SPA-style fallback to the root document.
    filePath = await resolveFile(join(OUT_DIR, "index.html"));
  }
  if (!filePath) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  try {
    const body = await readFile(filePath);
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME[extname(filePath)] || "application/octet-stream");
    res.end(body);
  } catch {
    res.statusCode = 500;
    res.end("Internal server error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Serving ${OUT_DIR} at http://${HOST}:${PORT}`);
});
