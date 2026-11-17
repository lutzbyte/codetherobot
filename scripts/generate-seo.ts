import { mkdirSync, writeFileSync } from "node:fs";
import { buildRobotsTxt, buildSitemapXml } from "../src/seo/sitemap";

// Bun memuat file .env otomatis ke process.env.
const site = process.env.VITE_SITE_URL?.trim();

if (!site) {
  console.warn(
    "[seo] VITE_SITE_URL is not set. Using http://localhost:5173. Set it in .env before deploying.",
  );
}

const base = site && site.length > 0 ? site : "http://localhost:5173";
const lastmod = new Date().toISOString().slice(0, 10);

mkdirSync("public", { recursive: true });
writeFileSync("public/sitemap.xml", buildSitemapXml(base, lastmod));
writeFileSync("public/robots.txt", buildRobotsTxt(base));

console.log(`[seo] Wrote public/sitemap.xml and public/robots.txt for ${base}`);