import React, { useState } from "react";
import GlobalDateCarousel from "../GlobalDateCarousel";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "./steps.css";

dayjs.extend(utc);
dayjs.extend(tz);

export default function StepDate({ onChange }) {
  const [date, setDate] = useState(null);

  return (
    <div className="step-container">
      <h4>Escolha a Data</h4>
      <GlobalDateCarousel
        selectedDate={date}
        onChange={(d) => {
          // ✅ Força o formato fixo e fuso de São Paulo
          // ✅ Força data exata local, sem fuso, sem UTC
const normalized = dayjs(d).format("YYYY-MM-DD");

          setDate(normalized);
          onChange(normalized);
        }}
        daysToShow={14}
      />
    </div>
  );
}
