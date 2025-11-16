import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, storageUrl } from "../config";

export default function useItemUpdate(id, navigate, reset, setValue) {
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState("");
  const [backgroundPreview, setBackgroundPreview] = useState("");
  const [newImageFile, setNewImageFile] = useState(null);
  const [establishment, setEstablishment] = useState(null);

  useEffect(() => {
    async function fetchItem() {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${apiBaseUrl}/item/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const item = res.data;

        setEstablishment(item.establishment ?? null);

        reset({
          name: item.name ?? "",
          type: item.type ?? "",
          description: item.description ?? "",
          price: String(item.price ?? ""),
          stock: String(item.stock ?? ""),
          status: String(item.status ?? 0),
          limited_by_user: String(item.limited_by_user ?? 0),
          category: item.category ?? "",
          subcategory: item.subcategory ?? "",
          brand: item.brand ?? "",
          availability_start: item.availability_start?.slice(0, 16) ?? "",
          availability_end: item.availability_end?.slice(0, 16) ?? "",
          tags: item.tags ?? "",
          discount: String(item.discount ?? ""),
          expiration_date: item.expiration_date?.slice(0, 10) ?? "",
          notes: item.notes ?? "",
          is_featured: item.is_featured ? "1" : "0",
          remove_image: 0,
        });

        setImagePreview(item.image ? `${storageUrl}/${item.image}` : "");
        setBackgroundPreview(
          item.establishment?.background
            ? `${storageUrl}/${item.establishment.background}`
            : ""
        );

      } catch {
        Swal.fire("Erro", "Não foi possível carregar o item", "error");
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [id, reset]);

  function handleRemoveImage() {
    setImagePreview("");
    setNewImageFile(null);
    setValue("remove_image", 1);
    setValue("image", null);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setNewImageFile(file);
    setValue("remove_image", 0);

    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  async function submitUpdate(data) {
    const token = localStorage.getItem("token");
    const formData = new FormData();

    Object.entries(data).forEach(([k, v]) => {
      formData.append(k, v);
    });

    if (data.remove_image == 1) {
      formData.set("image", "");
    } else if (newImageFile) {
      formData.append("image", newImageFile);
    }

    try {
      await axios.post(`${apiBaseUrl}/item/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire("Sucesso", "Item atualizado", "success");

      if (establishment?.slug) {
        navigate(`/item/list/${establishment.slug}`);
      } else {
        navigate(-1);
      }

    } catch {
      Swal.fire("Erro", "Falha ao atualizar", "error");
    }
  }

  return {
    loading,
    imagePreview,
    backgroundPreview,
    handleImageChange,
    handleRemoveImage,
    submitUpdate,
  };
}
