// src/hooks/useImageUtils.js
import { storageUrl } from "../config";

export default function useImageUtils(placeholder = "/images/logo.png") {
  const isAbsolute = (url) => {
    return /^https?:\/\//i.test(url);
  };

  const imageUrl = (path) => {
    if (!path) return placeholder;

    // Se já for URL completa → retorna ela
    if (isAbsolute(path)) return path;

    // Se for caminho relativo → monta usando storageUrl
    return `${storageUrl}/${path}`;
  };

  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = placeholder;
  };

  return { imageUrl, handleImgError };
}
