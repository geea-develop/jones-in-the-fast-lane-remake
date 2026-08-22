import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ports = [3000, 3001];

function listenerPids(port) {
  try {
    const output = execFileSync("lsof", [`-tiTCP:${port}`, "-sTCP:LISTEN"], { encoding: "utf8" });
    return output.split(/\s+/).filter(Boolean).map(Number);
  } catch {
    // lsof returns exit code 1 when no process is listening.
    return [];
  }
}

function isLocalProcess(pid) {
  try {
    const output = execFileSync("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"], { encoding: "utf8" });
    const cwd = output.split("\n").find((line) => line.startsWith("n"))?.slice(1);
    return cwd === repoRoot || cwd?.startsWith(`${repoRoot}${path.sep}`);
  } catch {
    return false;
  }
}

const localPids = new Set();
for (const port of ports) {
  for (const pid of listenerPids(port)) {
    if (!isLocalProcess(pid)) {
      console.warn(`Port ${port} is occupied by an unrelated process (${pid}); leaving it untouched.`);
      continue;
    }
    localPids.add(pid);
  }
}

for (const pid of localPids) {
  try {
    process.kill(pid, "SIGTERM");
    console.log(`Stopped stale local dev process ${pid}.`);
  } catch {
    // It may have exited between lsof and kill.
  }
}

if (localPids.size > 0) {
  await new Promise((resolve) => setTimeout(resolve, 300));
}

for (const pid of localPids) {
  try {
    process.kill(pid, 0);
    process.kill(pid, "SIGKILL");
    console.warn(`Force-stopped stale local dev process ${pid}.`);
  } catch {
    // Process exited cleanly.
  }
}
