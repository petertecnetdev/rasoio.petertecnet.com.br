// src/hooks/useItemUpdate.js
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../config";

export default function useItemUpdate(id, navigate, reset, setValue) {
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [establishment, setEstablishment] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);

  useEffect(() => {
    async function fetchItem() {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${apiBaseUrl}/item/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data;
        setItem(data);
        setEstablishment(data.establishment ?? null);

        reset({
          name: data.name ?? "",
          type: data.type ?? "service",
          duration: data.duration ?? "",
          description: data.description ?? "",
          price: data.price ?? "",
          stock: data.stock ?? "",
          status: data.status ?? "active",
          limited_by_user: data.limited_by_user ?? "no",
          category: data.category ?? "",
          subcategory: data.subcategory ?? "",
          brand: data.brand ?? "",
          availability_start: data.availability_start?.slice(0, 16) ?? "",
          availability_end: data.availability_end?.slice(0, 16) ?? "",
          tags: data.tags ?? "",
          discount: data.discount ?? "",
          expiration_date: data.expiration_date?.slice(0, 10) ?? "",
          notes: data.notes ?? "",
          is_featured: data.is_featured ? 1 : 0,
          remove_image: 0,
        });

        const primaryImage =
          data?.files?.find((f) => f.is_primary)?.public_url ??
          data?.image ??
          null;

        setImagePreview(primaryImage);
      } catch (err) {
        Swal.fire("Erro", "Não foi possível carregar o item.", "error");
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [id, reset]);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewImageFile(file);
    setValue("remove_image", 0);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setNewImageFile(null);
    setImagePreview(null);
    setValue("remove_image", 1);
  }

  async function submitUpdate(data) {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      Object.entries(data).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          formData.append(k, v);
        }
      });

      if (data.remove_image == 1) {
        formData.set("remove_image", 1);
      }

      if (newImageFile) {
        formData.append("image", newImageFile);
      }

      await axios.post(`${apiBaseUrl}/item/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire("Sucesso", "Item atualizado com sucesso.", "success");

      if (establishment?.slug) {
        navigate(`/item/list/${establishment.slug}`);
      } else {
        navigate(-1);
      }
    } catch (err) {
      Swal.fire(
        "Erro",
        err?.response?.data?.error || "Erro ao atualizar item.",
        "error"
      );
    }
  }

  return {
    loading,
    item,
    imagePreview,
    handleImageChange,
    handleRemoveImage,
    submitUpdate,
  };
}
