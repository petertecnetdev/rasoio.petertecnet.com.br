// src/hooks/useItemsFilter.js
import { useMemo } from "react";

export default function useItemsFilter(items) {
  const services = useMemo(
    () =>
      items.filter(
        (i) =>
          String(i.status) === "1" &&
          String(i.type).toLowerCase().includes("serv")
      ),
    [items]
  );

  const products = useMemo(
    () =>
      items.filter(
        (i) =>
          String(i.status) === "1" &&
          String(i.type).toLowerCase().includes("prod")
      ),
    [items]
  );

  return { services, products };
}
