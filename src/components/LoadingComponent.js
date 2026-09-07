import React from "react";
import ProcessingIndicatorComponent from "./ProcessingIndicatorComponent";

export default function LoadingComponent() {
  return (
    <ProcessingIndicatorComponent
      messages={[
        "Preparando sua experiência no Rasoio…",
        "Organizando serviços e horários…",
        "Quase lá — tudo está ficando pronto.",
      ]}
    />
  );
}
