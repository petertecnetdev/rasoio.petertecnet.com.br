import React, { useState, useEffect, useRef } from "react";
import "./GlobalDateCarousel.css";

export default function GlobalDateCarousel({
  selectedDate,
  onChange,
  daysToShow = 14,
}) {
  const TZ = "America/Sao_Paulo";
  const [days, setDays] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const today = new Date();
    const arr = Array.from({ length: daysToShow }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return {
        key: d.toISOString().split("T")[0],
        week: d.toLocaleDateString("pt-BR", { weekday: "short", timeZone: TZ }),
        day: d.getDate(),
        month: d.toLocaleDateString("pt-BR", { month: "short", timeZone: TZ }),
      };
    });
    setDays(arr);
  }, [daysToShow]);

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
    containerRef.current.scrollBy({ left: -100, behavior: "smooth" });
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(days.length - 1, prev + 1));
    containerRef.current.scrollBy({ left: 100, behavior: "smooth" });
  };

  const handleSelect = (key) => {
    if (onChange) onChange(key);
  };

  return (
    <div className="gdc-wrapper">
      <button className="gdc-nav" onClick={handlePrev}>
        ◀
      </button>
      <div className="gdc-container" ref={containerRef}>
        {days.map((d) => (
          <div
            key={d.key}
            className={`gdc-day ${
              selectedDate === d.key ? "active" : ""
            }`}
            onClick={() => handleSelect(d.key)}
          >
            <div className="gdc-week">{d.week}</div>
            <div className="gdc-daynum">{d.day}</div>
            <div className="gdc-month">{d.month}</div>
          </div>
        ))}
      </div>
      <button className="gdc-nav" onClick={handleNext}>
        ▶
      </button>
    </div>
  );
}
