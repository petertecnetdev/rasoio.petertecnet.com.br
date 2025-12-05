// src/hooks/useImageUtils.js
import { storageUrl } from "../config";

export default function useImageUtils() {
  const isAbsolute = (url) => /^https?:\/\//i.test(url);

  const imageUrl = (path) => {
    if (!path) return null;
    if (isAbsolute(path)) return path;
    return `${storageUrl}${path}`;
  };

  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "";
    e.currentTarget.dataset.broken = "true";  // ← MARCA COMO QUEBRADA
  };

  return { imageUrl, handleImgError };
}
