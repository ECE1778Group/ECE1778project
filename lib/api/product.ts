// lib/api/product.ts
import {useCallback} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useFetch} from "./fetch-client";
import {BASE_URL} from "../../constant";
import {CreateProductDTO, ProductDTO} from "../../interfaces/Product.interface";

export const useProductApi = () => {
  const {getData} = useFetch();

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
      const form = new FormData();
      form.append("title", body.title);
      form.append("description", body.description);
      form.append("category", body.category);
      form.append("price", String(body.price));
      form.append("quantity", String(body.quantity));

      if (body.picture_url) {
        const uri = body.picture_url;
        const name = uri.split("/").pop() || "photo.jpg";
        const extMatch = /\.(\w+)$/.exec(name);
        const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
        let mime = "image/jpeg";
        if (ext === "png") mime = "image/png";
        else if (ext === "heic") mime = "image/heic";

        form.append(
          "picture",
          {
            uri,
            name,
            type: mime,
          } as any
        );
      }

      const token = await AsyncStorage.getItem("access");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/api/product/`, {
        method: "POST",
        headers,
        body: form,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = (data as any)?.error || (data as any)?.message || "Request failed";
        const err: any = new Error(msg);
        err.status = res.status;
        throw err;
      }

      return data as ProductDTO;
    },
    []
  );

  return {searchProducts, getProduct, addProduct};
};