import { describe, expect, test } from "bun:test";
import { metaForPath } from "./meta";
import { INDEXABLE_PATHS, buildRobotsTxt, buildSitemapXml } from "./sitemap";

const PUBLIC = [
  "/",
  "/worlds",
  "/worlds/3",
  "/daily",
  "/how-to-play",
  "/about",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/contact",
];

const PRIVATE = [
  "/achievements",
  "/collection",
  "/settings",
  "/complete",
  "/play/2-4",
  "/challenge/time",
  "/nowhere",
  "/worlds/99",
];

describe("page metadata", () => {
  test("titles and descriptions are filled in and have search-friendly lengths", () => {
    for (const path of [...PUBLIC, ...PRIVATE]) {
      const meta = metaForPath(path);
      expect(meta.title.length).toBeGreaterThan(0);
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description.length).toBeGreaterThan(50);
      expect(meta.description.length).toBeLessThanOrEqual(160);
    }
  });

  test("public pages are indexable and personal or dynamic pages are not", () => {
    for (const path of PUBLIC) expect(metaForPath(path).indexable).toBe(true);
    for (const path of PRIVATE) expect(metaForPath(path).indexable).toBe(false);
  });

  test("every path in the sitemap is indexable and every public page is in the sitemap", () => {
    for (const path of INDEXABLE_PATHS) {
      expect(metaForPath(path).indexable).toBe(true);
    }
    for (const path of PUBLIC) {
      expect(INDEXABLE_PATHS).toContain(path);
    }
  });

  test("public pages have different titles from each other", () => {
    const titles = PUBLIC.map((path) => metaForPath(path).title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("sitemap and robots", () => {
  test("the sitemap lists every indexable page with absolute urls and no game routes", () => {
    const xml = buildSitemapXml("https://example.com/", "2026-11-16");
    expect((xml.match(/<loc>/g) ?? []).length).toBe(INDEXABLE_PATHS.length);
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).toContain("<loc>https://example.com/contact</loc>");
    expect(xml).not.toContain("/play/");
    expect(xml).not.toContain("https://example.com//");
  });

  test("robots.txt blocks game routes, allows the AdSense crawler and points to the sitemap", () => {
    const robots = buildRobotsTxt("https://example.com/");
    expect(robots).toContain("Disallow: /play/");
    expect(robots).toContain("Disallow: /challenge/");
    expect(robots).toContain("User-agent: Mediapartners-Google");
    expect(robots).toContain("Sitemap: https://example.com/sitemap.xml");
  });
});