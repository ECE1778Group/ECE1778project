// lib/api/product.ts
import { useCallback } from "react";
import { useFetch } from "./fetch-client";

type ProductDTO = {
  id: string;
  title: string;
  description?: string;
  price: number;
  picture_url?: string;
  category?: string;
  seller_username?: string;
  quantity?: number;
};

type CreateProductDTO = {
  title: string;
  description?: string;
  price: number;
  picture_url?: string;
  category?: string;
  quantity?: number;
};

export const useProductApi = () => {
  const { getData, postData } = useFetch();

  const searchProducts = useCallback(
    async (keyword: string) => {
      const q = keyword.trim();
      if (!q) return [];
      try {
        const res = await getData(
          `/api/product/search/?keyword=${encodeURIComponent(q)}`
        );
        return (res ?? []) as ProductDTO[];
      } catch (e: any) {
        return [];
      }
    },
    [getData]
  );

  const getProduct = useCallback(
    async (id: string) => {
      try {
        const res = await getData(
          `/api/product/details/${encodeURIComponent(id)}`
        );
        return (res ?? null) as ProductDTO | null;
      } catch (e: any) {
        const msg = (e && e.message ? String(e.message) : "").toLowerCase();
        if (msg.includes("not found") || msg.includes("404")) {
          return null;
        }
        return null;
      }
    },
    [getData]
  );

  const addProduct = useCallback(
    async (body: CreateProductDTO) => {
      const res = await postData("/api/product/", body);
      return res as ProductDTO;
    },
    [postData]
  );

  return { searchProducts, getProduct, addProduct };
};