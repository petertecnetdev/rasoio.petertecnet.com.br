import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, storageUrl } from "../config";

export default function useItemUpdate(id, navigate, reset, setValue) {
  const [loading, setLoading] = useState(true);

  const [item, setItem] = useState(null);
  const [establishment, setEstablishment] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);

  const [newImageFile, setNewImageFile] = useState(null);
  const [newBackgroundFile, setNewBackgroundFile] = useState(null);

  // =====================================================
  // 🔥 CARREGAR ITEM
  // =====================================================
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
  duration: data.duration ? String(data.duration) : "",
  description: data.description ?? "",
  price: String(data.price ?? ""),
  stock: String(data.stock ?? ""),
  status: String(data.status ?? "active"),
  limited_by_user: String(data.limited_by_user ?? "no"),
  category: data.category ?? "",
  subcategory: data.subcategory ?? "",
  brand: data.brand ?? "",
  availability_start: data.availability_start?.slice(0, 16) ?? "",
  availability_end: data.availability_end?.slice(0, 16) ?? "",
  tags: data.tags ?? "",
  discount: String(data.discount ?? ""),
  expiration_date: data.expiration_date?.slice(0, 10) ?? "",
  notes: data.notes ?? "",
  is_featured: data.is_featured ? "1" : "0",
  remove_image: 0,
});


        if (data?.image) {
          setImagePreview(`${storageUrl}/${data.image}`);
        }

        if (data?.establishment?.background) {
          setBackgroundPreview(`${storageUrl}/${data.establishment.background}`);
        }
      } catch (err) {
        console.log(err);
        Swal.fire("Erro", "Não foi possível carregar o item", "error");
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [id, reset]);

  // =====================================================
  // ❌ REMOVER IMAGEM
  // =====================================================
  function handleRemoveImage() {
    setImagePreview(null);
    setNewImageFile(null);
    setValue("remove_image", 1);
    setValue("image", null);
  }

  // =====================================================
  // 📸 ALTERAR IMAGEM COM PREVIEW
  // =====================================================
  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setNewImageFile(file);
    setValue("remove_image", 0);

    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  // =====================================================
  // 🌄 ALTERAR BACKGROUND COM PREVIEW
  // =====================================================
  function handleBackgroundChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setNewBackgroundFile(file);

    const url = URL.createObjectURL(file);
    setBackgroundPreview(url);
  }

  // =====================================================
  // 🚀 ATUALIZAR ITEM
  // =====================================================
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

    if (newBackgroundFile) {
      formData.append("background", newBackgroundFile);
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
    } catch (err) {
      Swal.fire("Erro", "Falha ao atualizar", "error");
    }
  }

  return {
    loading,
    item,
    imagePreview,
    backgroundPreview,
    handleImageChange,
    handleBackgroundChange,
    handleRemoveImage,
    submitUpdate,
  };
}
