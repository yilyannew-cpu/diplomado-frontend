import { apiClient } from "@/lib/api/client";
import { dedupeAsync } from "@/lib/api/admin/dedupeAsync";

export type CatalogComuna = {
  id: string;
  code: string;
  label: string;
  position: number;
};

export type CatalogVehicleType = {
  id: string;
  code: string;
  label: string;
  position: number;
  requires_plate: boolean;
};

export type CatalogMenuCategoryTemplate = {
  id: string;
  name: string;
  position: number;
};

type CatalogListResponse<T> = { data: T[] };

const TTL_MS = 10 * 60_000;

export const catalogApi = {
  listComunas(): Promise<CatalogComuna[]> {
    return dedupeAsync(
      "catalog:comunas",
      async () => {
        const res = await apiClient<CatalogListResponse<CatalogComuna>>("/catalog/comunas");
        return res.data ?? [];
      },
      { ttlMs: TTL_MS },
    );
  },

  listVehicleTypes(): Promise<CatalogVehicleType[]> {
    return dedupeAsync(
      "catalog:vehicle-types",
      async () => {
        const res = await apiClient<CatalogListResponse<CatalogVehicleType>>(
          "/catalog/vehicle-types",
        );
        return res.data ?? [];
      },
      { ttlMs: TTL_MS },
    );
  },

  listMenuCategoryTemplates(): Promise<CatalogMenuCategoryTemplate[]> {
    return dedupeAsync(
      "catalog:menu-category-templates",
      async () => {
        const res = await apiClient<CatalogListResponse<CatalogMenuCategoryTemplate>>(
          "/catalog/menu-category-templates",
        );
        return res.data ?? [];
      },
      { ttlMs: TTL_MS },
    );
  },
};
