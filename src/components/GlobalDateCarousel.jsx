import React, { useState, useEffect, useRef } from "react";
import "./GlobalDateCarousel.css";

export default function GlobalDateCarousel({
  selectedDate,
  onChange,
  daysToShow = 14,
}) {
  const TZ = "America/Sao_Paulo";
  const [days, setDays] = useState([]);
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
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: -200, behavior: "smooth" });
  };

  const handleNext = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: 200, behavior: "smooth" });
  };

  const handleSelect = (key) => {
    if (onChange) onChange(key);
    setTimeout(() => {
      const el = document.querySelector(`[data-key='${key}']`);
      if (el && containerRef.current) {
        const rect = el.getBoundingClientRect();
        const parentRect = containerRef.current.getBoundingClientRect();
        if (rect.left < parentRect.left || rect.right > parentRect.right) {
          el.scrollIntoView({ behavior: "smooth", inline: "center" });
        }
      }
    }, 100);
  };

  return (
    <div className="gdc-wrapper">
      <button className="gdc-nav" onClick={handlePrev} aria-label="Anterior">
        ◀
      </button>
      <div className="gdc-container" ref={containerRef}>
        {days.map((d) => (
          <div
            key={d.key}
            data-key={d.key}
            className={`gdc-day ${selectedDate === d.key ? "active" : ""}`}
            onClick={() => handleSelect(d.key)}
          >
            <div className="gdc-week">{d.week}</div>
            <div className="gdc-daynum">{d.day}</div>
            <div className="gdc-month">{d.month}</div>
          </div>
        ))}
      </div>
      <button className="gdc-nav" onClick={handleNext} aria-label="Próximo">
        ▶
      </button>
    </div>
  );
}
