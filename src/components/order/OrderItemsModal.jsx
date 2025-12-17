// src/components/order/OrderItemsModal.jsx
import { useEffect } from "react";
import PropTypes from "prop-types";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import OrderItemSelector from "./OrderItemSelector";

const MySwal = withReactContent(Swal);

export default function OrderItemsModal({
  show,
  onHide,
  items,
  selectedItems,
  toggleItem,
  loading,
}) {
  useEffect(() => {
    if (!show || loading) return;

    MySwal.fire({
      title: "Selecionar serviços",
      width: 800,
      padding: "16px",
      showConfirmButton: false,
      showCloseButton: true,
      backdrop: true,
      background: "#0b0b0d",
      color: "#fff",
      customClass: {
        popup: "swal-dark-popup compact-items-modal",
        closeButton: "swal-close-btn",
      },
      html: (
        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            padding: "8px 4px",
          }}
        >
          <OrderItemSelector
            items={items}
            selectedItems={selectedItems}
            toggleItem={toggleItem}
            loading={loading}
            compact
          />
        </div>
      ),
      didClose: () => {
        onHide?.();
      },
    });

    return () => {
      MySwal.close();
    };
  }, [show, loading, items, selectedItems, toggleItem, onHide]);

  return null;
}

OrderItemsModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func,
  items: PropTypes.array.isRequired,
  selectedItems: PropTypes.object.isRequired,
  toggleItem: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

OrderItemsModal.defaultProps = {
  loading: false,
};
