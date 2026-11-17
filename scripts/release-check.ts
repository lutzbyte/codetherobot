import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { runReleaseChecks } from "./releaseChecks";

const dist = "dist";

if (!existsSync(dist)) {
  console.error("[release] dist/ not found. Run `bun run build` first.");
  process.exit(1);
}

const files = new Set<string>();
const chunks: { name: string; bytes: number }[] = [];

for (const entry of readdirSync(dist, { recursive: true })) {
  const rel = String(entry).replace(/\\/g, "/");
  const full = join(dist, rel);
  if (!statSync(full).isFile()) continue;
  files.add(rel);
  if (rel.startsWith("assets/") && rel.endsWith(".js")) {
    chunks.push({ name: rel.slice("assets/".length), bytes: statSync(full).size });
  }
}

const read = (path: string): string | null =>
  existsSync(join(dist, path)) ? readFileSync(join(dist, path), "utf8") : null;

const findings = runReleaseChecks({
  files,
  indexHtml: read("index.html") ?? "",
  adsTxt: read("ads.txt"),
  siteInfoSource: readFileSync("src/site/siteInfo.ts", "utf8"),
  jsChunks: chunks,
  siteUrl: process.env.VITE_SITE_URL,
});

const sizes = [...chunks].sort((a, b) => b.bytes - a.bytes);
console.log("Largest scripts:");
for (const chunk of sizes.slice(0, 4)) {
  console.log(`  ${(chunk.bytes / 1000).toFixed(0).padStart(6)} KB  ${chunk.name}`);
}

if (findings.length === 0) {
  console.log("\nRelease check passed with no findings.");
} else {
  console.log("");
  for (const f of findings) {
    console.log(`${f.level === "error" ? "ERROR  " : "WARNING"}  ${f.message}`);
  }
}

const errors = findings.filter((f) => f.level === "error").length;
if (errors > 0) {
  console.error(`\n${errors} error(s). Fix them before releasing.`);
  process.exit(1);
}