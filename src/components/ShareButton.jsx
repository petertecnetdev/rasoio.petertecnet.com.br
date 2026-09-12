import React from "react";
import { FaShareAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import "./ShareButton.css";

const copyTextFallback = (value) => {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) throw new Error("copy_failed");
};

export default function ShareButton({
  destinationUrl,
  title = "Rasoio",
  text = "Confira esta agenda no Rasoio!",
  source = "organic_share",
  reference,
}) {
  const buildShareUrl = () => {
    const target = new URL(destinationUrl || window.location.href, window.location.origin);

    if (source) target.searchParams.set("source", source);
    if (reference) target.searchParams.set("ref", reference);
    target.searchParams.set("utm_source", "rasoio");
    target.searchParams.set("utm_medium", "share");
    target.searchParams.set("utm_campaign", "public_agenda");

    return target.toString();
  };

  const handleShare = async () => {
    const shareUrl = buildShareUrl();

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.warn("Falha no compartilhamento nativo:", err);
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        copyTextFallback(shareUrl);
      }

      Swal.fire({
        icon: "success",
        title: "Link da agenda copiado!",
        text: "Agora é só enviar para seus clientes.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível copiar o link da agenda.",
      });
    }
  };

  return (
    <button
      className="share-fab"
      onClick={handleShare}
      title="Compartilhar agenda"
      aria-label="Compartilhar agenda"
    >
      <FaShareAlt className="share-icon" />
    </button>
  );
}
