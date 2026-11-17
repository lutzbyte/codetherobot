export interface PageTags {
  title: string;
  description: string;
  url: string;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function metaTag(attr: "name" | "property", key: string, content: string): string {
  return `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
}

function metaPattern(attr: "name" | "property", key: string): RegExp {
  return new RegExp(`<meta[^>]*\\b${attr}="${key}"[^>]*>`, "i");
}

function replaceFirst(html: string, pattern: RegExp, replacement: string): string {
  return pattern.test(html) ? html.replace(pattern, () => replacement) : html;
}

/**
 * Membuat salinan index.html dengan judul, deskripsi, canonical, Open Graph, dan Twitter
 * khusus satu halaman. Crawler dan pratinjau media sosial membacanya tanpa menjalankan JavaScript.
 */
export function renderPageHtml(template: string, tags: PageTags): string {
  let html = template;
  html = replaceFirst(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(tags.title)}</title>`);
  html = replaceFirst(
    html,
    metaPattern("name", "description"),
    metaTag("name", "description", tags.description),
  );
  html = replaceFirst(
    html,
    /<link[^>]*\brel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(tags.url)}" />`,
  );
  html = replaceFirst(html, metaPattern("property", "og:title"), metaTag("property", "og:title", tags.title));
  html = replaceFirst(
    html,
    metaPattern("property", "og:description"),
    metaTag("property", "og:description", tags.description),
  );
  html = replaceFirst(html, metaPattern("property", "og:url"), metaTag("property", "og:url", tags.url));
  html = replaceFirst(html, metaPattern("name", "twitter:title"), metaTag("name", "twitter:title", tags.title));
  html = replaceFirst(
    html,
    metaPattern("name", "twitter:description"),
    metaTag("name", "twitter:description", tags.description),
  );
  return html;
}