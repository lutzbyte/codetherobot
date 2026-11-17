import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { metaForPath } from "../src/seo/meta";
import { INDEXABLE_PATHS } from "../src/seo/sitemap";
import { renderPageHtml } from "./prerenderLogic";

const dist = "dist";
const indexPath = join(dist, "index.html");

if (!existsSync(indexPath)) {
  console.error("[prerender] dist/index.html not found. Run the build first.");
  process.exit(1);
}

const template = readFileSync(indexPath, "utf8");
const configured = process.env.VITE_SITE_URL?.trim().replace(/\/+$/, "");
const base = configured && configured.length > 0 ? configured : "http://localhost:5173";

let count = 0;
for (const path of INDEXABLE_PATHS) {
  // index.html sudah membawa tag halaman utama.
  if (path === "/") continue;
  const meta = metaForPath(path);
  const html = renderPageHtml(template, {
    title: meta.title,
    description: meta.description,
    url: `${base}${path}`,
  });
  const target = join(dist, path, "index.html");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html);
  count += 1;
}

// Cadangan untuk hosting yang memakai 404.html sebagai fallback aplikasi (mis. GitHub Pages).
writeFileSync(join(dist, "404.html"), template);

console.log(`[prerender] Wrote ${count} page(s) and dist/404.html`);