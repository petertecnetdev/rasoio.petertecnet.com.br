// src/hooks/useItemCreate.js
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  createManagedItem,
  findManagedEstablishmentBySlug,
} from "../services/platformManagementApi";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

export default function useItemCreate(
  navigate,
  reset,
  setValue,
  establishmentFromState = null
) {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [image, setImage] = useState(null);
  const [establishment, setEstablishment] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const setupFromEstablishment = (establishmentValue) => {
      setEstablishment(establishmentValue);
      setValue("status", true);
    };

    (async () => {
      if (establishmentFromState?.id) {
        setupFromEstablishment(establishmentFromState);
        setLoading(false);
        return;
      }

      if (!slug) {
        setLoading(false);
        await Swal.fire({
          icon: "error",
          title: "Estabelecimento não identificado",
          text: "Não foi possível identificar o estabelecimento para cadastrar o item.",
        });
        navigate("/establishment/my");
        return;
      }

      try {
        const resolved = await findManagedEstablishmentBySlug(slug, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        if (!resolved?.id) {
          throw new Error(
            "Este estabelecimento não foi encontrado entre as unidades que você administra na Rasoio."
          );
        }

        setupFromEstablishment(resolved);
      } catch (error) {
        if (isRequestCanceled(error)) return;
        await Swal.fire({
          icon: "error",
          title: "Não foi possível abrir o cadastro",
          text: error?.message?.startsWith("Este estabelecimento")
            ? error.message
            : getApiErrorMessage(error, "Erro ao identificar o estabelecimento."),
        });
        navigate("/establishment/my");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [slug, navigate, setValue, establishmentFromState]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview(null);
    setValue("image", null);
  }

  async function submitCreate(data) {
    if (!establishment?.id) {
      await Swal.fire({
        icon: "error",
        title: "Estabelecimento indisponível",
        text: "Não foi possível identificar o estabelecimento deste item.",
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("establishment_id", String(establishment.id));

      Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        if (["app_id", "entity_id", "entity_name", "image"].includes(key)) return;

        if (Array.isArray(value)) {
          value.forEach((entry) => formData.append(`${key}[]`, entry));
          return;
        }

        formData.append(key, value);
      });

      if (image) formData.append("image", image);

      const response = await createManagedItem(formData);
      await Swal.fire({
        icon: "success",
        title: "Item cadastrado",
        text: response?.message || "Item cadastrado com sucesso.",
      });

      reset();
      navigate(`/establishment/item/${establishment.slug}${data?.type === "product" ? "?type=product" : ""}`);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Não foi possível cadastrar",
        text: getApiErrorMessage(error, "Erro ao criar item."),
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    establishment,
    imagePreview,
    handleImageChange,
    handleRemoveImage,
    submitCreate,
  };
}
