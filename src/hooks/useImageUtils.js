// src/hooks/useImageUtils.js
import { storageUrl } from "../config";

export default function useImageUtils(placeholder = "/images/logo.png") {
  const imageUrl = (path) => (!path ? placeholder : `${storageUrl}/${path}`);
  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = placeholder;
  };
  return { imageUrl, handleImgError };
}
