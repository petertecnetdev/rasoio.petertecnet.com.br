// src/hooks/useItemCreate.js
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, appId } from "../config";

export default function useItemCreate(navigate, reset, setValue) {
  const { slug } = useParams(); // AQUI slug É O ID DO ESTABELECIMENTO

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (!slug) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Estabelecimento não identificado.",
      }).then(() => navigate(-1));
      return;
    }

    setValue("app_id", appId);
    setValue("entity_id", Number(slug));
    setValue("entity_name", "establishment");
  }, [slug, setValue, navigate]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setImages(files);
    setImagePreview(URL.createObjectURL(files[0]));
  };

  const handleRemoveImage = () => {
    setImages([]);
    setImagePreview(null);
    setValue("images", null);
  };

  const submitCreate = async (data) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      images.forEach((file) => {
        formData.append("images[]", file);
      });

      const { data: response } = await axios.post(
        `${apiBaseUrl}/item`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Sucesso",
        text: response.message,
      }).then(() => {
        reset();
        navigate(-1);
      });
    } catch (err) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstKey = Object.keys(errors)[0];
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: errors[firstKey][0],
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: err.response?.data?.error || "Erro ao criar item.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    imagePreview,
    handleImageChange,
    handleRemoveImage,
    submitCreate,
  };
}
