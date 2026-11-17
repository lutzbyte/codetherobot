import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSettings } from "@/state/settings";
import { SITE_NAME, metaForPath } from "./meta";

function upsertMeta(attr: "name" | "property", key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function siteBase(): string {
  const configured: unknown = import.meta.env.VITE_SITE_URL;
  const base =
    typeof configured === "string" && configured.length > 0
      ? configured
      : window.location.origin;
  return base.replace(/\/+$/, "");
}

/** Memperbarui judul, deskripsi, canonical, Open Graph, robots, dan lang saat route atau bahasa berubah. */
export function RouteSeo() {
  const { pathname } = useLocation();
  const { language } = useSettings();

  useEffect(() => {
    const meta = metaForPath(pathname);
    const url = `${siteBase()}${pathname}`;

    document.title = meta.title;
    upsertMeta("name", "description", meta.description);
    upsertMeta("name", "robots", meta.indexable ? "index,follow" : "noindex,follow");
    upsertMeta("property", "og:title", meta.title);
    upsertMeta("property", "og:description", meta.description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("name", "twitter:title", meta.title);
    upsertMeta("name", "twitter:description", meta.description);
    upsertCanonical(url);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}