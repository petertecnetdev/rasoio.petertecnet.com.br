const GOOGLE_MAP_HOST_PATTERN = /(^|\.)google\.[a-z.]+$/i;

const decodeHtmlAmpersands = (value) => value.replace(/&amp;/gi, "&");

const extractIframeSrc = (value) => {
  const match = value.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/i);
  return match?.[1] ? decodeHtmlAmpersands(match[1].trim()) : null;
};

const isAllowedGoogleMapUrl = (value) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      GOOGLE_MAP_HOST_PATTERN.test(url.hostname) &&
      (url.pathname.includes("/maps") || url.hostname.startsWith("maps."))
    );
  } catch {
    return false;
  }
};

const extractDestinationFromDirections = (value) => {
  try {
    const url = new URL(value);
    const marker = "/dir/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const parts = url.pathname.slice(markerIndex + marker.length).split("/").filter(Boolean);
    const destination = parts[1] || parts[0];
    return destination
      ? decodeURIComponent(destination.replace(/\+/g, " ")).trim()
      : null;
  } catch {
    return null;
  }
};

export const buildSafeMapEmbedUrl = (location, fallbackAddress = "") => {
  const rawLocation = typeof location === "string" ? location.trim() : "";
  const fallback = typeof fallbackAddress === "string" ? fallbackAddress.trim() : "";

  if (rawLocation) {
    const iframeSrc = extractIframeSrc(rawLocation);
    if (iframeSrc && isAllowedGoogleMapUrl(iframeSrc)) return iframeSrc;

    if (isAllowedGoogleMapUrl(rawLocation)) {
      const destination = extractDestinationFromDirections(rawLocation);
      if (!destination) return rawLocation;
      return `https://www.google.com/maps?q=${encodeURIComponent(destination)}&z=15&output=embed`;
    }
  }

  const query = fallback || (rawLocation && !rawLocation.includes("<") ? rawLocation : "");
  if (!query) return null;

  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
};
