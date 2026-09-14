import React from "react";
import { FaShareAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import { trackTelemetryEvent } from "../telemetry";
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

const trackShareResult = ({ source, reference, method, result }) => {
  trackTelemetryEvent("rasoio_public_agenda_share_result", {
    label: "Compartilhamento da agenda pública",
    target: "public_agenda",
    metadata: {
      source: source || "organic_share",
      reference: reference || undefined,
      method,
      result,
    },
  });
};

const openWhatsAppShare = ({ text, shareUrl }) => {
  const message = [text, shareUrl].filter(Boolean).join("\n");
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const anchor = document.createElement("a");
  anchor.href = whatsappUrl;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
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
        trackShareResult({ source, reference, method: "native", result: "shared" });
        return;
      } catch (err) {
        if (err?.name === "AbortError") {
          trackShareResult({ source, reference, method: "native", result: "cancelled" });
          return;
        }
        trackShareResult({ source, reference, method: "native", result: "failed" });
        console.warn("Falha no compartilhamento nativo:", err);
      }
    }

    try {
      openWhatsAppShare({ text, shareUrl });
      trackShareResult({ source, reference, method: "whatsapp", result: "opened" });
      return;
    } catch (error) {
      trackShareResult({ source, reference, method: "whatsapp", result: "failed" });
      console.warn("Falha ao abrir compartilhamento pelo WhatsApp:", error);
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        copyTextFallback(shareUrl);
      }

      trackShareResult({ source, reference, method: "clipboard", result: "copied" });
      Swal.fire({
        icon: "success",
        title: "Link da agenda copiado!",
        text: "Agora é só enviar para seus clientes.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch {
      trackShareResult({ source, reference, method: "clipboard", result: "failed" });
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível compartilhar nem copiar o link da agenda.",
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
