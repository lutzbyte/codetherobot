import { describe, expect, test } from "bun:test";
import { INDEXABLE_PATHS } from "../src/seo/sitemap";
import { runReleaseChecks } from "./releaseChecks";
import type { ReleaseInput } from "./releaseChecks";

function cleanInput(): ReleaseInput {
  const files = new Set<string>([
    "index.html",
    "sitemap.xml",
    "robots.txt",
    "manifest.webmanifest",
    "favicon.svg",
    "og-image.png",
    "ads.txt",
  ]);
  for (const path of INDEXABLE_PATHS) {
    if (path !== "/") files.add(`${path.slice(1)}/index.html`);
  }
  return {
    files,
    indexHtml: '<link rel="canonical" href="https://example.com/" />',
    adsTxt: "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0",
    siteInfoSource: 'export const CONTACT_EMAIL = "me@example.org";\nexport const OPERATOR_NAME = "Jane";',
    jsChunks: [
      { name: "index-abc.js", bytes: 120_000 },
      { name: "phaser-def.js", bytes: 1_200_000 },
    ],
    siteUrl: "https://example.com",
  };
}

describe("release checks", () => {
  test("a clean build has no findings", () => {
    expect(runReleaseChecks(cleanInput())).toEqual([]);
  });

  test("example values and unreplaced placeholders are errors", () => {
    const findings = runReleaseChecks({
      ...cleanInput(),
      indexHtml: '<link rel="canonical" href="%VITE_SITE_URL%/" />',
      siteInfoSource: 'export const CONTACT_EMAIL = "your-email@example.com";',
      siteUrl: "http://localhost:5173",
    });
    const errors = findings.filter((f) => f.level === "error").map((f) => f.message);
    expect(errors.some((m) => m.includes("%VITE_"))).toBe(true);
    expect(errors.some((m) => m.includes("VITE_SITE_URL"))).toBe(true);
    expect(errors.some((m) => m.includes("CONTACT_EMAIL"))).toBe(true);
  });

  test("missing files are errors, and a missing social image or example ads.txt are warnings", () => {
    const input = cleanInput();
    const files = new Set(input.files);
    files.delete("sitemap.xml");
    files.delete("og-image.png");
    const findings = runReleaseChecks({
      ...input,
      files,
      adsTxt: "google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0",
    });
    expect(findings.some((f) => f.level === "error" && f.message.includes("sitemap.xml"))).toBe(true);
    expect(findings.some((f) => f.level === "warning" && f.message.includes("og-image.png"))).toBe(true);
    expect(findings.some((f) => f.level === "warning" && f.message.includes("ads.txt"))).toBe(true);
  });

  test("an oversized main script or missing prerendered pages produce warnings", () => {
    const input = cleanInput();
    const files = new Set(input.files);
    files.delete("worlds/3/index.html");
    const findings = runReleaseChecks({
      ...input,
      files,
      jsChunks: [{ name: "index-abc.js", bytes: 2_000_000 }],
    });
    expect(findings.some((f) => f.message.includes("main script"))).toBe(true);
    expect(findings.some((f) => f.message.includes("/worlds/3"))).toBe(true);
    expect(findings.every((f) => f.level === "warning")).toBe(true);
  });
});