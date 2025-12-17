// src/hooks/useImageUtils.js
import { storageUrl } from "../config";

export default function useImageUtils(fallback = null) {
  const isAbsolute = (url) => /^https?:\/\//i.test(url);

  const normalize = (base, path) => {
    if (!base) return path;
    if (base.endsWith("/") && path.startsWith("/")) return base + path.slice(1);
    if (!base.endsWith("/") && !path.startsWith("/")) return `${base}/${path}`;
    return base + path;
  };

  const imageUrl = (path) => {
    if (!path) return null;
    if (isAbsolute(path)) return path;
    return normalize(storageUrl, path);
  };

  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    if (fallback) {
      e.currentTarget.src = fallback;
    } else {
      e.currentTarget.removeAttribute("src");
    }
  };

  return { imageUrl, handleImgError };
}
