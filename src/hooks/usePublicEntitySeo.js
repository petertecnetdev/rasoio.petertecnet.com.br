import { useEffect } from "react";

const SITE_URL = "https://rasoio.petertecnet.com.br";
const JSON_LD_ID = "rasoio-public-entity-jsonld";

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

const ensureJsonLd = (payload) => {
  let element = document.getElementById(JSON_LD_ID);
  if (!element) {
    element = document.createElement("script");
    element.id = JSON_LD_ID;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(payload);
};

const absoluteUrl = (value) => {
  if (!value) return undefined;
  try {
    return new URL(value, SITE_URL).toString();
  } catch {
    return undefined;
  }
};

export const buildPublicEntitySeo = ({ title, description, canonicalPath, image }) => {
  if (!title || !canonicalPath) return null;

  const safeTitle = String(title).trim();
  const safeDescription = String(description || "").trim().slice(0, 180);
  const url = new URL(canonicalPath, SITE_URL).toString();
  const fullTitle = `${safeTitle} | Rasoio`;
  const fallbackDescription = `Veja informações, serviços e disponibilidade de ${safeTitle} na Rasoio.`;
  const resolvedDescription = safeDescription || fallbackDescription;
  const resolvedImage = absoluteUrl(image);
  const entityType = canonicalPath.startsWith("/establishment/") ? "LocalBusiness" : "WebPage";

  return {
    url,
    fullTitle,
    description: resolvedDescription,
    image: resolvedImage,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": entityType,
      name: safeTitle,
      description: resolvedDescription,
      url,
      ...(resolvedImage ? { image: resolvedImage } : {}),
    },
  };
};

export default function usePublicEntitySeo({ title, description, canonicalPath, image }) {
  useEffect(() => {
    const seo = buildPublicEntitySeo({ title, description, canonicalPath, image });
    if (!seo) return undefined;

    document.title = seo.fullTitle;
    ensureMeta('meta[name="description"]', {
      name: "description",
      content: seo.description,
    });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: seo.fullTitle });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: seo.description,
    });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: seo.url });
    ensureMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    if (seo.image) ensureMeta('meta[property="og:image"]', { property: "og:image", content: seo.image });
    ensureMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: seo.image ? "summary_large_image" : "summary",
    });
    ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: seo.fullTitle });
    ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: seo.description,
    });
    if (seo.image) ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: seo.image });
    ensureCanonical(seo.url);
    ensureJsonLd(seo.jsonLd);

    return () => {
      document.getElementById(JSON_LD_ID)?.remove();
    };
  }, [title, description, canonicalPath, image]);
}