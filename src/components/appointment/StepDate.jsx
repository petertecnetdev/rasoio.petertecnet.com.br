import React, { useState } from "react";
import GlobalDateCarousel from "../GlobalDateCarousel";
import "./steps.css";

export default function StepDate({ onChange }) {
  const [date, setDate] = useState(null);
  return (
    <div className="step-container">
      <h4>Escolha a Data</h4>
      <GlobalDateCarousel
        selectedDate={date}
        onChange={(d) => {
          setDate(d);
          onChange(d);
        }}
        daysToShow={14}
      />
    </div>
  );
}
