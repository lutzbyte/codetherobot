import { INDEXABLE_PATHS } from "../src/seo/sitemap";

export interface Finding {
  level: "error" | "warning";
  message: string;
}

export interface ReleaseInput {
  /** Path relatif semua berkas di dist, mis. "index.html" atau "assets/index-abc.js". */
  files: ReadonlySet<string>;
  indexHtml: string;
  adsTxt: string | null;
  /** Teks berkas src/site/siteInfo.ts. */
  siteInfoSource: string;
  jsChunks: readonly { name: string; bytes: number }[];
  siteUrl: string | undefined;
}

const REQUIRED_FILES = [
  "index.html",
  "sitemap.xml",
  "robots.txt",
  "manifest.webmanifest",
  "favicon.svg",
];

const MAIN_CHUNK_LIMIT = 700_000;

/** Pemeriksaan sebelum rilis. Error = jangan rilis dulu; warning = sebaiknya diperbaiki. */
export function runReleaseChecks(input: ReleaseInput): Finding[] {
  const findings: Finding[] = [];
  const error = (message: string): void => {
    findings.push({ level: "error", message });
  };
  const warn = (message: string): void => {
    findings.push({ level: "warning", message });
  };

  for (const file of REQUIRED_FILES) {
    if (!input.files.has(file)) error(`Missing ${file} in dist.`);
  }

  if (/%VITE_[A-Z_]+%/.test(input.indexHtml)) {
    error("index.html still contains %VITE_...% placeholders. Set VITE_SITE_URL in .env and rebuild.");
  }

  const url = input.siteUrl?.trim() ?? "";
  if (!/^https:\/\/[^/]+/.test(url) || /localhost|127\.0\.0\.1/.test(url)) {
    error("VITE_SITE_URL must be your public https address, not localhost.");
  }

  if (input.siteInfoSource.includes("your-email@example.com")) {
    error("CONTACT_EMAIL in src/site/siteInfo.ts is still the example address.");
  }
  if (input.siteInfoSource.includes('OPERATOR_NAME = "the Code the Robot team"')) {
    warn("OPERATOR_NAME in src/site/siteInfo.ts is still the default. Use your own name or team.");
  }

  if (!input.files.has("og-image.png")) {
    warn("public/og-image.png is missing, so social previews will have no image.");
  }

  if (input.adsTxt === null) {
    warn("ads.txt is missing from dist.");
  } else if (input.adsTxt.includes("pub-0000000000000000")) {
    warn("ads.txt still contains the example publisher id.");
  }

  const main = input.jsChunks.find((chunk) => chunk.name.startsWith("index-"));
  if (main && main.bytes > MAIN_CHUNK_LIMIT) {
    warn(
      `The main script is ${Math.round(main.bytes / 1000)} KB. Code splitting may not be working.`,
    );
  }

  for (const path of INDEXABLE_PATHS) {
    if (path === "/") continue;
    if (!input.files.has(`${path.slice(1)}/index.html`)) {
      warn(`Prerendered page missing for ${path}. Did the prerender step run?`);
    }
  }

  return findings;
}