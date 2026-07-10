import type { ApiCategory, ApiProduct } from "@/lib/api/types/admin";
import { apiClient, apiUpload } from "@/lib/api/client";

export const categoriesApi = {
  update(
    categoryId: string,
    body: Partial<{ name: string; position: number; image: string }>,
  ): Promise<ApiCategory> {
    return apiClient(`/categories/${categoryId}`, { method: "PATCH", body, auth: true });
  },

  delete(categoryId: string): Promise<void> {
    return apiClient(`/categories/${categoryId}`, { method: "DELETE", auth: true });
  },

  uploadImage(categoryId: string, file: File): Promise<ApiCategory> {
    return apiUpload(`/categories/${categoryId}/image`, file, { auth: true });
  },
};

export const productsApi = {
  list(
    params: {
      restaurantId: string;
      categoryId?: string;
      available?: boolean;
    },
    options?: { auth?: boolean },
  ): Promise<ApiProduct[]> {
    const search = new URLSearchParams();
    search.set("restaurantId", params.restaurantId);
    if (params.categoryId) search.set("categoryId", params.categoryId);
    if (params.available !== undefined) search.set("available", String(params.available));
    return apiClient(`/products?${search.toString()}`, { auth: options?.auth ?? false });
  },

  get(productId: string): Promise<ApiProduct> {
    return apiClient(`/products/${productId}`);
  },

  create(body: {
    name: string;
    description: string;
    price: number;
    category_id: string;
    restaurant_id: string;
    image?: string;
    available?: boolean;
  }): Promise<ApiProduct> {
    return apiClient("/products", { method: "POST", body, auth: true });
  },

  update(
    productId: string,
    body: Partial<{
      name: string;
      description: string;
      price: number;
      category_id: string;
      image: string;
      available: boolean;
    }>,
  ): Promise<ApiProduct> {
    return apiClient(`/products/${productId}`, { method: "PATCH", body, auth: true });
  },

  toggleAvailability(productId: string): Promise<ApiProduct> {
    return apiClient(`/products/${productId}/availability`, { method: "PATCH", auth: true });
  },

  delete(productId: string): Promise<void> {
    return apiClient(`/products/${productId}`, { method: "DELETE", auth: true });
  },

  uploadImage(productId: string, file: File): Promise<ApiProduct> {
    return apiUpload(`/products/${productId}/image`, file, { auth: true });
  },

  setIngredients(
    productId: string,
    ingredients: Array<{ name: string; available: boolean }>,
  ): Promise<ApiProduct> {
    return apiClient(`/products/${productId}/ingredients`, {
      method: "PUT",
      body: { ingredients },
      auth: true,
    });
  },

  setModifierGroups(
    productId: string,
    modifierGroups: Array<{
      name: string;
      min_selections: number;
      max_selections: number;
      options: Array<{ name: string; price_extra: number; available: boolean }>;
    }>,
  ): Promise<ApiProduct> {
    return apiClient(`/products/${productId}/modifier-groups`, {
      method: "PUT",
      body: { modifier_groups: modifierGroups },
      auth: true,
    });
  },
};
