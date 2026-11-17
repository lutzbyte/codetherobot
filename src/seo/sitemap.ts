/** Halaman yang boleh diindeks mesin pencari. Harus sejalan dengan metaForPath(). */
export const INDEXABLE_PATHS: readonly string[] = [
  "/",
  "/worlds",
  "/worlds/1",
  "/worlds/2",
  "/worlds/3",
  "/worlds/4",
  "/worlds/5",
  "/daily",
  "/how-to-play",
  "/about",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/contact",
];

function cleanBase(base: string): string {
  return base.trim().replace(/\/+$/, "");
}

export function buildSitemapXml(base: string, lastmod: string): string {
  const root = cleanBase(base);
  const urls = INDEXABLE_PATHS.map(
    (path) =>
      `  <url>\n    <loc>${root}${path === "/" ? "/" : path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildRobotsTxt(base: string): string {
  const root = cleanBase(base);
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /play/",
    "Disallow: /complete",
    "Disallow: /challenge/",
    "",
    "User-agent: Mediapartners-Google",
    "Allow: /",
    "",
    `Sitemap: ${root}/sitemap.xml`,
    "",
  ].join("\n");
}