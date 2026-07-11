import citiesData from "@/lib/data/colombia/cities.json";
import departmentsData from "@/lib/data/colombia/departments.json";

export type ColombiaCityEntry = {
  id: string;
  name: string;
  departmentId: number;
  zones: string[];
};

export type SelectOption = {
  value: string;
  label: string;
};

export type CitySelectGroup = {
  label: string;
  options: SelectOption[];
};

type RawCity = {
  id: number;
  name: string;
  departmentId: number;
};

type RawDepartment = {
  id: number;
  name: string;
};

/**
 * Zonas/barrios conocidos para ciudades principales (resto: campo libre en el formulario).
 */
const CITY_ZONES_BY_NAME: Record<string, string[]> = {
  Medellín: [
    "El Poblado",
    "Laureles",
    "Centro",
    "Belén",
    "La América",
    "Buenos Aires",
    "Castilla",
    "Robledo",
    "Guayabal",
    "Aranjuez",
    "Manrique",
    "Santa Cruz",
    "San Javier",
    "Doce de Octubre",
    "Altavista",
  ],
  Envigado: ["Centro", "Zona Rosa", "Las Vegas", "Loma del Escobero", "Jardines", "Alto de las Palmas"],
  Bello: ["Centro", "Niquía", "San Félix", "La Mota", "Alsacia", "Copacabana"],
  Itagüí: ["Centro", "Parque Principal", "Contador", "San Pío", "Los Naranjos"],
  Sabaneta: ["Centro", "El Carmelo", "Gran Manzana", "Aves María", "La Doctora"],
  Rionegro: ["Centro", "San Antonio", "Llanogrande", "Vereda El Tablazo"],
  "Bogotá D.C.": [
    "Chapinero",
    "Usaquén",
    "Suba",
    "Kennedy",
    "Engativá",
    "Teusaquillo",
    "La Candelaria",
    "Ciudad Bolívar",
    "Bosa",
    "Fontibón",
    "San Cristóbal",
    "Usme",
    "Puente Aranda",
    "Barrios Unidos",
    "Antonio Nariño",
    "Rafael Uribe Uribe",
    "Santa Fe",
    "Sumapaz",
  ],
  Soacha: ["Centro", "Compartir", "San Mateo", "Meissen", "Ciudad Verde"],
  Chía: ["Centro", "Chía Alta", "La Balsa", "Menche", "Callejón"],
  Cajicá: ["Centro", "Calahorra", "El Retiro", "Calle 3"],
  Zipaquirá: ["Centro", "La Paz", "El Refugio", "Bavaria"],
  Facatativá: ["Centro", "Salitre", "La Estación", "Primavera"],
  Cali: [
    "Centro",
    "San Antonio",
    "Granada",
    "El Peñón",
    "Ciudad Jardín",
    "Pance",
    "Meléndez",
    "Normandía",
    "Versalles",
    "San Fernando",
    "Limonar",
  ],
  Palmira: ["Centro", "Zamorano", "Rozo", "La Riverita", "Ríohacha"],
  Yumbo: ["Centro", "Industrial", "Diamante", "La Estancia"],
  Jamundí: ["Centro", "Alameda", "Ciudad del Río", "Villa del Río"],
  Barranquilla: ["Riomar", "Norte Centro Histórico", "Sur Occidente", "Metropolitana", "Sur Oriente", "El Prado"],
  Soledad: ["Centro", "Villa Santos", "Los Olivos", "La Ilusión"],
  Cartagena: ["Centro Histórico", "Bocagrande", "Castillo Grande", "Manga", "Getsemaní", "Crespo", "La Boquilla"],
  Bucaramanga: ["Cabecera", "García Rovira", "La Concordia", "Provenza", "Ciudadela Real de Minas", "Sotomayor"],
  Floridablanca: ["Centro", "Cañaveral", "Bucarica", "La Cumbre"],
  Girón: ["Centro", "Villa Niza", "Oití", "Los Girasoles"],
  Pereira: ["Centro", "Circunvalar", "Cuba", "Boston", "Villa Santana", "Olímpica"],
  Dosquebradas: ["Centro", "Zona Rosa", "La Unión", "San Francisco"],
  Manizales: ["Centro", "Milán", "Palogrande", "Sultana", "Versalles", "Chipre"],
  Armenia: ["Centro", "Quindío", "Norte", "Sur", "La Castellana"],
  "Santa Marta": ["Centro Histórico", "Rodadero", "Gaira", "Mamatoco", "Taganga", "Bastidas"],
  Cúcuta: [
    "Centro",
    "Centro Oriental",
    "Oriental Oriental",
    "Oriental Occidental",
    "Occidental",
    "Sur Occidental",
    "Sur Oriental",
    "Norte",
    "Atalaya",
    "La Libertad",
  ],
  Ibagué: ["Centro", "Belén", "La Pola", "Picaleña", "Calle 60", "San Fernando"],
  Villavicencio: ["Centro", "Barzal", "Villavicencio Norte", "Villavicencio Sur", "Porfia"],
  Pasto: ["Centro", "San Juan de Pasto", "Guillermo León Valencia", "Obrero", "Granada"],
  Montería: ["Centro", "El Recreo", "Los Cerros", "La Castellana", "Buenavista"],
  Neiva: ["Centro", "Norte", "Sur", "Oriente", "Neiva Real", "Santafé"],
  Valledupar: ["Centro", "Norte", "Sur", "Oriente", "Villa Esperanza"],
  Popayán: ["Centro", "Centro Histórico", "Norte", "Sur", "Oriente", "Humboldt"],
  Tunja: ["Centro", "Norte", "Sur", "Muisca", "San Lázaro"],
  Sincelejo: ["Centro", "La Esperanza", "San Pedro", "Municipal", "Las Brisas"],
  Riohacha: ["Centro", "Norte", "Sur", "Los Alpes", "Balneario"],
  Buenaventura: ["Centro", "La Playita", "Bellavista", "Cascajal"],
  Fusagasugá: ["Centro", "La Villa", "El Jardín", "San Cayetano", "La Pampa"],
  Quibdó: ["Centro", "Norte", "Sur", "El Cocal", "Terra Nova"],
  Florencia: ["Centro", "Norte", "Sur", "El Raicero"],
  Yopal: ["Centro", "Norte", "Sur", "Manacacías"],
  Mocoa: ["Centro", "Norte", "Sur", "El Dorado"],
  Leticia: ["Centro", "Zona Franca", "Morichal", "San Rafael"],
  "San Andrés": ["Centro", "San Luis", "La Loma", "Sarie Bay"],
  Arauca: ["Centro", "Norte", "Sur", "La Esmeralda"],
  Mitú: ["Centro", "Norte", "Sur"],
  Inírida: ["Centro", "Norte", "Sur"],
  "Puerto Carreño": ["Centro", "Norte", "Sur"],
};

function normalizeCityName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

const zonesByNormalizedName = new Map<string, string[]>(
  Object.entries(CITY_ZONES_BY_NAME).map(([name, zones]) => [normalizeCityName(name), zones]),
);

function zonesForCityName(name: string): string[] {
  return zonesByNormalizedName.get(normalizeCityName(name)) ?? [];
}

const ALL_CITIES: ColombiaCityEntry[] = (citiesData.data as RawCity[])
  .map((city) => ({
    id: String(city.id),
    name: city.name,
    departmentId: city.departmentId,
    zones: zonesForCityName(city.name),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "es"));

/** Solo ciudades principales (no municipios menores). */
const MAJOR_CITY_NAMES = new Set(
  Object.keys(CITY_ZONES_BY_NAME).map((name) => normalizeCityName(name)),
);

const MAJOR_CITIES: ColombiaCityEntry[] = ALL_CITIES.filter((city) =>
  MAJOR_CITY_NAMES.has(normalizeCityName(city.name)),
);

const cityById = new Map(ALL_CITIES.map((city) => [city.id, city]));

const departmentNameById = new Map(
  (departmentsData.data as RawDepartment[]).map((dept) => [dept.id, dept.name]),
);

export function getCitySelectOptions(): SelectOption[] {
  return MAJOR_CITIES.map((city) => ({
    value: city.id,
    label: city.name,
  })).sort((a, b) => a.label.localeCompare(b.label, "es"));
}

function groupCitiesByDepartment(cities: ColombiaCityEntry[]): CitySelectGroup[] {
  const byDepartment = new Map<number, SelectOption[]>();

  for (const city of cities) {
    const list = byDepartment.get(city.departmentId) ?? [];
    list.push({ value: city.id, label: city.name });
    byDepartment.set(city.departmentId, list);
  }

  return (departmentsData.data as RawDepartment[])
    .map((dept) => ({
      label: dept.name,
      options: (byDepartment.get(dept.id) ?? []).sort((a, b) =>
        a.label.localeCompare(b.label, "es"),
      ),
    }))
    .filter((group) => group.options.length > 0);
}

/** Ciudades principales de Colombia agrupadas por departamento. */
export function getCitySelectGroups(): CitySelectGroup[] {
  return groupCitiesByDepartment(MAJOR_CITIES);
}

/** @deprecated Preferir getCitySelectGroups (solo ciudades). */
export function getAllMunicipalitySelectGroups(): CitySelectGroup[] {
  return groupCitiesByDepartment(ALL_CITIES);
}

export function getCityById(cityId: string): ColombiaCityEntry | undefined {
  return cityById.get(cityId);
}

export function getZonesForCity(cityId: string): string[] {
  const city = getCityById(cityId);
  return city?.zones ?? [];
}

export function formatCityZoneLabel(cityId: string, zone: string): string {
  const city = getCityById(cityId);
  if (!city) return zone.trim();
  return `${city.name} · ${zone.trim()}`;
}

export function getDepartmentNameForCity(cityId: string): string | undefined {
  const city = getCityById(cityId);
  if (!city) return undefined;
  return departmentNameById.get(city.departmentId);
}

/** Total de ciudades principales en el catálogo de registro. */
export const COLOMBIA_CITY_COUNT = MAJOR_CITIES.length;
