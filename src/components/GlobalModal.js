// src/components/GlobalModal.js
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const GlobalModal = {
  open: ({
    title,
    html,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    showCancel = true,
    icon = null,
    onConfirm,
    onCancel,
    width = 600,
  }) => {
    MySwal.fire({
      title,
      html,
      icon,
      showCancelButton: showCancel,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      width,
      focusConfirm: false,
      customClass: {
        popup: "global-modal-popup",
        confirmButton: "global-modal-confirm",
        cancelButton: "global-modal-cancel",
      },
    }).then((result) => {
      if (result.isConfirmed && onConfirm) onConfirm();
      if (result.isDismissed && onCancel) onCancel();
    });
  },

  close: () => {
    Swal.close();
  },

  loading: (title = "Carregando...") => {
    Swal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  },
};

export default GlobalModal;
