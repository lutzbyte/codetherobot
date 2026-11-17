import { describe, expect, test } from "bun:test";
import { escapeHtml, renderPageHtml } from "./prerenderLogic";

const TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta name="theme-color" content="#16213e" />
    <title>Old title</title>
    <meta
      name="description"
      content="old desc"
    />
    <link rel="canonical" href="https://example.com/" />
    <meta property="og:title" content="old og" />
    <meta property="og:description" content="old og desc" />
    <meta property="og:url" content="https://example.com/" />
    <meta name="twitter:title" content="old tw" />
    <meta name="twitter:description" content="old tw desc" />
  </head>
  <body><div id="root">KEEP ME</div></body>
</html>`;

const TAGS = {
  title: "New title | Site",
  description: "New description",
  url: "https://example.com/worlds/3",
};

describe("prerender", () => {
  test("replaces the title, description, canonical, Open Graph and Twitter tags", () => {
    const html = renderPageHtml(TEMPLATE, TAGS);
    expect(html).toContain("<title>New title | Site</title>");
    expect(html).toContain('<meta name="description" content="New description" />');
    expect(html).toContain('<link rel="canonical" href="https://example.com/worlds/3" />');
    expect(html).toContain('<meta property="og:title" content="New title | Site" />');
    expect(html).toContain('<meta property="og:url" content="https://example.com/worlds/3" />');
    expect(html).toContain('<meta name="twitter:description" content="New description" />');
    for (const old of ["Old title", "old desc", "old og", "old tw"]) {
      expect(html).not.toContain(old);
    }
  });

  test("escapes characters that would break the markup", () => {
    expect(escapeHtml(`Tom & Jerry's "Guide" <x>`)).toBe(
      "Tom &amp; Jerry&#39;s &quot;Guide&quot; &lt;x&gt;",
    );
    const html = renderPageHtml(TEMPLATE, { ...TAGS, title: `A & "B"` });
    expect(html).toContain("<title>A &amp; &quot;B&quot;</title>");
  });

  test("leaves the rest of the page alone and gives the same result when run twice", () => {
    const once = renderPageHtml(TEMPLATE, TAGS);
    expect(once).toContain('<div id="root">KEEP ME</div>');
    expect(once).toContain('<meta name="theme-color" content="#16213e" />');
    expect(renderPageHtml(once, TAGS)).toBe(once);
  });
});