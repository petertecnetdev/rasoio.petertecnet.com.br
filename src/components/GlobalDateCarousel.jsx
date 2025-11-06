import React, { useEffect, useState, useRef } from "react";
import "./GlobalDateCarousel.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(tz);

export default function GlobalDateCarousel({ selectedDate, onChange, daysToShow = 14 }) {
  const TZ = "America/Sao_Paulo";
  const [days, setDays] = useState([]);
  const trackRef = useRef(null);

  useEffect(() => {
    const today = dayjs().tz(TZ).startOf("day");
    const arr = Array.from({ length: daysToShow }, (_, i) => {
      const d = today.add(i, "day");
      return {
        key: d.format("YYYY-MM-DD"),
        week: d.format("ddd").toUpperCase(),
        day: d.date(),
        month: d.format("MMM").toUpperCase(),
      };
    });
    console.log("📅 Dias gerados:", arr);
    setDays(arr);
  }, [daysToShow]);

  useEffect(() => {
    if (!selectedDate && days.length > 0) {
      const todayKey = dayjs().tz(TZ).format("YYYY-MM-DD");
      onChange(todayKey);
    }
  }, [selectedDate, days, onChange]);

  useEffect(() => {
    if (!trackRef.current || !selectedDate) return;
    const idx = days.findIndex((d) => d.key === selectedDate);
    if (idx >= 0) {
      const child = trackRef.current.children[idx];
      if (child) child.scrollIntoView({ behavior: "smooth", inline: "center" });
    }
  }, [selectedDate, days]);

  return (
    <div className="date-carousel-container">
      {days.length === 0 ? (
        <div className="date-loading">Carregando datas...</div>
      ) : (
        <div className="date-carousel-track" ref={trackRef}>
          {days.map((d) => {
            const isActive = selectedDate === d.key;
            return (
              <button
                key={d.key}
                className={`date-item ${isActive ? "active" : ""}`}
                onClick={() => onChange(d.key)}
              >
                <span className="date-week">{d.week}</span>
                <span className="date-day">{d.day}</span>
                <span className="date-month">{d.month}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
