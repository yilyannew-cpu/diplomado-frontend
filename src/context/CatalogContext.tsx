import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  catalogApi,
  type CatalogComuna,
  type CatalogMenuCategoryTemplate,
  type CatalogVehicleType,
} from "@/lib/api/endpoints/catalog";
import { setCatalogComunaCodes } from "@/lib/catalogCache";

type CatalogState = {
  comunas: CatalogComuna[];
  vehicleTypes: CatalogVehicleType[];
  menuCategoryTemplates: CatalogMenuCategoryTemplate[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [comunas, setComunas] = useState<CatalogComuna[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<CatalogVehicleType[]>([]);
  const [menuCategoryTemplates, setMenuCategoryTemplates] = useState<
    CatalogMenuCategoryTemplate[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextComunas, nextVehicles, nextCategories] = await Promise.all([
        catalogApi.listComunas(),
        catalogApi.listVehicleTypes(),
        catalogApi.listMenuCategoryTemplates(),
      ]);
      setComunas(nextComunas);
      setVehicleTypes(nextVehicles);
      setMenuCategoryTemplates(nextCategories);
      setCatalogComunaCodes(nextComunas.map((c) => c.code));
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudieron cargar los catálogos";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      comunas,
      vehicleTypes,
      menuCategoryTemplates,
      isLoading,
      error,
      refresh,
    }),
    [comunas, vehicleTypes, menuCategoryTemplates, isLoading, error, refresh],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogState {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog debe usarse dentro de CatalogProvider");
  }
  return ctx;
}
