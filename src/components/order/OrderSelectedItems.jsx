// src/components/order/OrderSelectedItems.jsx
import { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Card } from "react-bootstrap";
import useImageUtils from "../../hooks/useImageUtils";
import GlobalButton from "../GlobalButton";
import "./OrderSelectedItems.css";

export default function OrderSelectedItems({
  items = {},
  onIncrease,
  onDecrease,
  onRemove,
}) {
  const { imageUrl } = useImageUtils();

  const list = useMemo(() => Object.values(items), [items]);

  if (!list.length) return null;

  return (
    <div className="order-selected-items mt-4">
      <h5>Serviços selecionados</h5>

      {list.map((item) => (
        <SelectedItemCard
          key={item.item_id}
          item={item}
          imageUrl={imageUrl}
          onIncrease={() => onIncrease(item.item_id)}
          onDecrease={() => onDecrease(item.item_id)}
          onRemove={() => onRemove(item.item_id)}
        />
      ))}
    </div>
  );
}

function SelectedItemCard({ item, imageUrl, onIncrease, onDecrease, onRemove }) {
  const [broken, setBroken] = useState(false);

  const safeItem = useMemo(
    () => ({
      ...item,
      name: item.name || "Serviço",
      images: item.images || null,
      image: item.image || null,
    }),
    [item]
  );

  const image = useMemo(() => {
    const paths = [
      safeItem.image,
      safeItem.images?.avatar,
      Array.isArray(safeItem.images?.gallery)
        ? safeItem.images.gallery[0]
        : null,
    ];

    for (const p of paths) {
      const url = imageUrl(p);
      if (url) return url;
    }
    return null;
  }, [safeItem, imageUrl]);

  const initials = useMemo(() => {
    const parts = safeItem.name.split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : parts[0][0].toUpperCase() +
          parts.at(-1)[0].toUpperCase();
  }, [safeItem.name]);

  const placeholderSvg = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0b1c2d" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" rx="24" ry="24" fill="url(#g)" />
        <text
          x="50%"
          y="54%"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="72"
          font-weight="700"
          fill="#e5e7eb"
          font-family="Inter, Arial, sans-serif"
        >
          ${initials}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [initials]);

  return (
    <Card className="order-selected-item-card mb-2">
      <Card.Body className="d-flex align-items-center gap-3">
        <img
          src={image && !broken ? image : placeholderSvg}
          alt={safeItem.name}
          className="order-selected-item-image"
          loading="lazy"
          onError={() => setBroken(true)}
        />

        <div className="flex-grow-1">
          <div className="fw-semibold">{safeItem.name}</div>
          <div className="text-muted small">
            {safeItem.duration || 30} min
          </div>

          <div className="d-flex align-items-center gap-2 mt-2">
            <GlobalButton
              size="sm"
              variant="outline-info"
              onClick={onDecrease}
              disabled={item.quantity <= 1}
            >
              −
            </GlobalButton>

            <strong>{item.quantity}</strong>

            <GlobalButton
              size="sm"
              variant="outline-info"
              onClick={onIncrease}
            >
              +
            </GlobalButton>
          </div>
        </div>

        <div className="text-end">
          <div>
            R${" "}
            {(Number(item.price) * Number(item.quantity))
              .toFixed(2)
              .replace(".", ",")}
          </div>

          <GlobalButton
            size="sm"
            variant="outline-danger"
            className="mt-2"
            onClick={onRemove}
          >
            Remover
          </GlobalButton>
        </div>
      </Card.Body>
    </Card>
  );
}

OrderSelectedItems.propTypes = {
  items: PropTypes.object.isRequired,
  onIncrease: PropTypes.func.isRequired,
  onDecrease: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};
