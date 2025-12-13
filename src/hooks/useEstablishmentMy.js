// src/hooks/useEstablishmentMy.js
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function useEstablishmentMy(apiBaseUrl) {
  const [establishments, setEstablishments] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/my/category/barbershop`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let ests = [];
        if (Array.isArray(data)) {
          ests = data;
        } else if (Array.isArray(data.establishments)) {
          ests = data.establishments;
        } else if (
          data.establishments &&
          Array.isArray(data.establishments.data)
        ) {
          ests = data.establishments.data;
        } else if (Array.isArray(data.data)) {
          ests = data.data;
        }

        setEstablishments(ests);

        const today = new Date().toLocaleDateString("en-CA", {
          timeZone: "America/Sao_Paulo",
        });

        const results = await Promise.all(
          ests.map(async (est) => {
            let rawOrders = [];
            try {
              const res = await axios.get(`${apiBaseUrl}/order/listbyentity`, {
                params: {
                  app_id: 2,
                  entity_name: "establishment",
                  entity_id: est.id,
                },
                headers: { Authorization: `Bearer ${token}` },
              });

              rawOrders = Array.isArray(res.data.orders) ? res.data.orders : [];
            } catch (err) {
              if (err.response?.status === 404) {
                rawOrders = [];
              } else {
                throw err;
              }
            }

            const orders = rawOrders.filter((o) => {
              const date = new Date(o.order_datetime).toLocaleDateString(
                "en-CA",
                {
                  timeZone: "America/Sao_Paulo",
                }
              );
              return date === today;
            });

            const totalOrders = orders.length;
            const totalValue = orders.reduce((sum, o) => {
              const orderSum = (o.items || []).reduce((s, it) => {
                let sub = Number(it.subtotal || 0);
                (it.modifiers || [])
                  .filter((m) => m.type === "addition")
                  .forEach((m) => {
                    const prod = (it.modifiers || []).find(
                      (p) => p.id === m.modifier_id
                    );
                    sub += (prod ? Number(prod.price) : 0) * (m.quantity || 1);
                  });
                return s + sub;
              }, 0);
              return sum + orderSum;
            }, 0);

            const itemCounts = {};
            orders.forEach((o) =>
              (o.items || []).forEach((it) => {
                const name = it.item?.name || "-";
                itemCounts[name] = (itemCounts[name] || 0) + (it.quantity || 0);
              })
            );
            const mostOrderedItem =
              Object.entries(itemCounts).reduce(
                (max, [name, qty]) => (qty > max[1] ? [name, qty] : max),
                ["-", 0]
              )[0] || "-";

            const customerSums = {};
            orders.forEach((o) => {
              const sum = (o.items || []).reduce((s, it) => {
                let sub = Number(it.subtotal || 0);
                (it.modifiers || [])
                  .filter((m) => m.type === "addition")
                  .forEach((m) => {
                    const prod = (it.modifiers || []).find(
                      (p) => p.id === m.modifier_id
                    );
                    sub += (prod ? Number(prod.price) : 0) * (m.quantity || 1);
                  });
                return s + sub;
              }, 0);
              const cname = o.customer_name || "-";
              customerSums[cname] = (customerSums[cname] || 0) + sum;
            });
            const topCustomer =
              Object.entries(customerSums).reduce(
                (max, [name, sum]) => (sum > max[1] ? [name, sum] : max),
                ["-", 0]
              )[0] || "-";

            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const now = new Date();
            const hoursElapsed = Math.max((now - start) / 36e5, 1);
            const avgOrdersPerHour = (totalOrders / hoursElapsed).toFixed(2);
            const avgTicket = totalOrders
              ? (totalValue / totalOrders).toFixed(2)
              : "0.00";

            return [
              est.id,
              {
                totalOrders,
                totalValue: totalValue.toFixed(2),
                mostOrderedItem,
                topCustomer,
                avgOrdersPerHour,
                avgTicket,
              },
            ];
          })
        );

        setMetrics(Object.fromEntries(results));
      } catch (err) {
        const status = err.response?.status;
        Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            status === 401
              ? "Sessão expirada. Faça login novamente."
              : "Não foi possível carregar dados.",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [apiBaseUrl]);

  return {
    establishments,
    metrics,
    isLoading,
  };
}
