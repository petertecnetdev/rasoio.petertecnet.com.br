import { useEffect } from "react";

const SITE_URL = "https://rasoio.petertecnet.com.br";

const ensureMeta = (selector, attrs) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attrs).forEach(([key, value]) => {
    if (value) element.setAttribute(key, value);
  });
};

const ensureCanonical = (href) => {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
};

export default function usePublicEntitySeo({ title, description, canonicalPath, image }) {
  useEffect(() => {
    if (!title || !canonicalPath) return;

    const safeDescription = String(description || "").trim().slice(0, 180);
    const url = new URL(canonicalPath, SITE_URL).toString();
    const fullTitle = `${String(title).trim()} | Rasoio`;

    document.title = fullTitle;
    ensureMeta('meta[name="description"]', {
      name: "description",
      content: safeDescription || `Veja informações, serviços e disponibilidade de ${title} na Rasoio.`,
    });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: safeDescription || `Veja informações, serviços e disponibilidade de ${title} na Rasoio.`,
    });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: url });
    ensureMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    if (image) ensureMeta('meta[property="og:image"]', { property: "og:image", content: image });
    ensureCanonical(url);
  }, [title, description, canonicalPath, image]);
}
