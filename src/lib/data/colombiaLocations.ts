export type ColombiaCityEntry = {
  id: string;
  name: string;
  zones: string[];
};

/**
 * Ciudades principales de Colombia con sus zonas/barrios.
 * Solo aparecen ciudades (no municipios pequeños).
 */
export const COLOMBIA_CITY_CATALOG: ColombiaCityEntry[] = [
  {
    id: "medellin",
    name: "Medellín",
    zones: [
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
  },
  {
    id: "envigado",
    name: "Envigado",
    zones: ["Centro", "Zona Rosa", "Las Vegas", "Loma del Escobero", "Jardines", "Alto de las Palmas"],
  },
  {
    id: "bello",
    name: "Bello",
    zones: ["Centro", "Niquía", "San Félix", "La Mota", "Alsacia", "Copacabana"],
  },
  {
    id: "itagui",
    name: "Itagüí",
    zones: ["Centro", "Parque Principal", "Contador", "San Pío", "Los Naranjos"],
  },
  {
    id: "sabaneta",
    name: "Sabaneta",
    zones: ["Centro", "El Carmelo", "Gran Manzana", "Aves María", "La Doctora"],
  },
  {
    id: "rionegro",
    name: "Rionegro",
    zones: ["Centro", "San Antonio", "Llanogrande", "Vereda El Tablazo"],
  },
  {
    id: "bogota",
    name: "Bogotá D.C.",
    zones: [
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
  },
  { id: "soacha", name: "Soacha", zones: ["Centro", "Compartir", "San Mateo", "Meissen", "Ciudad Verde"] },
  { id: "chia", name: "Chía", zones: ["Centro", "Chía Alta", "La Balsa", "Menche", "Callejón"] },
  { id: "cajica", name: "Cajicá", zones: ["Centro", "Calahorra", "El Retiro", "Calle 3"] },
  { id: "zipaquira", name: "Zipaquirá", zones: ["Centro", "La Paz", "El Refugio", "Bavaria"] },
  { id: "facatativa", name: "Facatativá", zones: ["Centro", "Salitre", "La Estación", "Primavera"] },
  {
    id: "cali",
    name: "Cali",
    zones: [
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
  },
  { id: "palmira", name: "Palmira", zones: ["Centro", "Zamorano", "Rozo", "La Riverita", "Ríohacha"] },
  { id: "yumbo", name: "Yumbo", zones: ["Centro", "Industrial", "Diamante", "La Estancia"] },
  { id: "jamundi", name: "Jamundí", zones: ["Centro", "Alameda", "Ciudad del Río", "Villa del Río"] },
  {
    id: "barranquilla",
    name: "Barranquilla",
    zones: ["Riomar", "Norte Centro Histórico", "Sur Occidente", "Metropolitana", "Sur Oriente", "El Prado"],
  },
  { id: "soledad", name: "Soledad", zones: ["Centro", "Villa Santos", "Los Olivos", "La Ilusión"] },
  {
    id: "cartagena",
    name: "Cartagena",
    zones: ["Centro Histórico", "Bocagrande", "Castillo Grande", "Manga", "Getsemaní", "Crespo", "La Boquilla"],
  },
  {
    id: "bucaramanga",
    name: "Bucaramanga",
    zones: ["Cabecera", "García Rovira", "La Concordia", "Provenza", "Ciudadela Real de Minas", "Sotomayor"],
  },
  { id: "floridablanca", name: "Floridablanca", zones: ["Centro", "Cañaveral", "Bucarica", "La Cumbre"] },
  { id: "giron", name: "Girón", zones: ["Centro", "Villa Niza", "Oití", "Los Girasoles"] },
  {
    id: "pereira",
    name: "Pereira",
    zones: ["Centro", "Circunvalar", "Cuba", "Boston", "Villa Santana", "Olímpica"],
  },
  { id: "dosquebradas", name: "Dosquebradas", zones: ["Centro", "Zona Rosa", "La Unión", "San Francisco"] },
  { id: "manizales", name: "Manizales", zones: ["Centro", "Milán", "Palogrande", "Sultana", "Versalles", "Chipre"] },
  { id: "armenia", name: "Armenia", zones: ["Centro", "Quindío", "Norte", "Sur", "La Castellana"] },
  {
    id: "santa-marta",
    name: "Santa Marta",
    zones: ["Centro Histórico", "Rodadero", "Gaira", "Mamatoco", "Taganga", "Bastidas"],
  },
  { id: "cucuta", name: "Cúcuta", zones: ["Centro", "Los Patios", "El Zulia", "Caobos", "Atalaya", "San Luis"] },
  { id: "ibague", name: "Ibagué", zones: ["Centro", "Belén", "La Pola", "Picaleña", "Calle 60", "San Fernando"] },
  {
    id: "villavicencio",
    name: "Villavicencio",
    zones: ["Centro", "Barzal", "Villavicencio Norte", "Villavicencio Sur", "Porfia"],
  },
  { id: "pasto", name: "Pasto", zones: ["Centro", "San Juan de Pasto", "Guillermo León Valencia", "Obrero", "Granada"] },
  { id: "monteria", name: "Montería", zones: ["Centro", "El Recreo", "Los Cerros", "La Castellana", "Buenavista"] },
  { id: "neiva", name: "Neiva", zones: ["Centro", "Norte", "Sur", "Oriente", "Neiva Real", "Santafé"] },
  { id: "valledupar", name: "Valledupar", zones: ["Centro", "Norte", "Sur", "Oriente", "Villa Esperanza"] },
  { id: "popayan", name: "Popayán", zones: ["Centro", "Centro Histórico", "Norte", "Sur", "Oriente", "Humboldt"] },
  { id: "tunja", name: "Tunja", zones: ["Centro", "Norte", "Sur", "Muisca", "San Lázaro"] },
  { id: "sincelejo", name: "Sincelejo", zones: ["Centro", "La Esperanza", "San Pedro", "Municipal", "Las Brisas"] },
  { id: "riohacha", name: "Riohacha", zones: ["Centro", "Norte", "Sur", "Los Alpes", "Balneario"] },
  { id: "buenaventura", name: "Buenaventura", zones: ["Centro", "La Playita", "Bellavista", "Cascajal"] },
  { id: "fusagasuga", name: "Fusagasugá", zones: ["Centro", "La Villa", "El Jardín", "San Cayetano", "La Pampa"] },
  { id: "quibdo", name: "Quibdó", zones: ["Centro", "Norte", "Sur", "El Cocal", "Terra Nova"] },
  { id: "florencia", name: "Florencia", zones: ["Centro", "Norte", "Sur", "El Raicero"] },
  { id: "yopal", name: "Yopal", zones: ["Centro", "Norte", "Sur", "Manacacías"] },
  { id: "mocoa", name: "Mocoa", zones: ["Centro", "Norte", "Sur", "El Dorado"] },
  { id: "leticia", name: "Leticia", zones: ["Centro", "Zona Franca", "Morichal", "San Rafael"] },
  { id: "san-andres", name: "San Andrés", zones: ["Centro", "San Luis", "La Loma", "Sarie Bay"] },
  { id: "arauca", name: "Arauca", zones: ["Centro", "Norte", "Sur", "La Esmeralda"] },
  { id: "mitu", name: "Mitú", zones: ["Centro", "Norte", "Sur"] },
  { id: "inirida", name: "Inírida", zones: ["Centro", "Norte", "Sur"] },
  { id: "puerto-carreno", name: "Puerto Carreño", zones: ["Centro", "Norte", "Sur"] },
];

const cityById = new Map(COLOMBIA_CITY_CATALOG.map((city) => [city.id, city]));

export type SelectOption = {
  value: string;
  label: string;
};

export function getCitySelectOptions(): SelectOption[] {
  return COLOMBIA_CITY_CATALOG.map((city) => ({
    value: city.id,
    label: city.name,
  }));
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
  if (!city) return zone;
  return `${city.name} · ${zone}`;
}
