// src/hooks/useImageUtils.js
import { useMemo, useCallback } from "react";
import { storageUrl } from "../config";
import { buildInitialsImageDataUri } from "../utils/imageFallback";

export default function useImageUtils(options = {}) {
  const normalizedOptions =
    options && typeof options === "object" && !Array.isArray(options) ? options : {};
  const { fallbackText = "" } = normalizedOptions;

  const isAbsolute = (url) => /^(?:https?:\/\/|data:|blob:)/i.test(url);

  const normalize = (base, path) => {
    if (!base) return path;
    if (base.endsWith("/") && path.startsWith("/")) return base + path.slice(1);
    if (!base.endsWith("/") && !path.startsWith("/")) return `${base}/${path}`;
    return base + path;
  };

  const imageUrl = useCallback((path) => {
    if (!path || typeof path !== "string") return null;
    if (isAbsolute(path)) return path;

    if (path.startsWith("storage/")) {
      const base = storageUrl.replace(/\/storage\/?$/, "");
      return normalize(base, path);
    }

    return normalize(storageUrl, path);
  }, []);

  const placeholderSvg = useMemo(
    () => buildInitialsImageDataUri(fallbackText),
    [fallbackText]
  );

  const handleImgError = useCallback(
    (event) => {
      if (!event?.currentTarget) return;
      event.currentTarget.removeAttribute("srcset");
      event.currentTarget.removeAttribute("sizes");
      event.currentTarget.dataset.imageFallbackApplied = "true";
      event.currentTarget.classList.add("pt-image-fallback");
      event.currentTarget.src = placeholderSvg;
    },
    [placeholderSvg]
  );

  return {
    imageUrl,
    handleImgError,
    placeholderSvg,
  };
}
