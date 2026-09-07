import React from "react";
import ProcessingIndicatorComponent from "./ProcessingIndicatorComponent";

export default function GlobalLoadingIndicator() {
  return (
    <ProcessingIndicatorComponent
      messages={[
        "Preparando sua experiência no Rasoio…",
        "Conectando sua operação…",
        "Quase lá — tudo está ficando pronto.",
      ]}
    />
  );
}
