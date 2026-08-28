import { useCallback, useEffect, useState } from "react";

const readCity = () => ({
  city: localStorage.getItem("selectedCity") || "",
  uf: localStorage.getItem("selectedUF") || "",
});

export default function useSelectedCity() {
  const [location, setLocation] = useState(readCity);

  const sync = useCallback(() => {
    setLocation((current) => {
      const next = readCity();
      return current.city === next.city && current.uf === next.uf ? current : next;
    });
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "selectedCity" || event.key === "selectedUF") sync();
    };

    window.addEventListener("cityChanged", sync);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("cityChanged", sync);
      window.removeEventListener("storage", handleStorage);
    };
  }, [sync]);

  const setSelectedCity = useCallback(({ city, uf }) => {
    if (city) localStorage.setItem("selectedCity", city);
    else localStorage.removeItem("selectedCity");

    if (uf) localStorage.setItem("selectedUF", uf);
    else localStorage.removeItem("selectedUF");

    setLocation({ city: city || "", uf: uf || "" });
    window.dispatchEvent(new Event("cityChanged"));
  }, []);

  return {
    city: location.city,
    uf: location.uf,
    cityLabel:
      location.city && location.uf
        ? `${location.city} - ${location.uf}`
        : location.city,
    setSelectedCity,
  };
}
