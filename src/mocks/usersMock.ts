export type Role = "cliente" | "admin" | "superadmin" | "domiciliario";
export type VehicleType = "Motocicleta" | "Bicicleta" | "Automóvil";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  vehicle?: string;
  status: "Activo" | "Suspendido";
  // Campos extendidos para domiciliario
  document_id?: string;
  vehicle_type?: VehicleType;
  vehicle_plate?: string;
  vehicle_description?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export const usersMock: MockUser[] = [
  { id: "USR-01", name: "Laura Martínez", email: "cliente@burgercore.co", password: "demo", role: "cliente", phone: "+57 310 555 0102", status: "Activo" },
  { id: "USR-02", name: "Carlos Restrepo", email: "admin@burgercore.co", password: "demo", role: "admin", phone: "+57 311 555 0211", status: "Activo" },
  { id: "USR-03", name: "Ana Lucía Vélez", email: "super@burgercore.co", password: "demo", role: "superadmin", phone: "+57 312 555 0322", status: "Activo" },
  { id: "USR-04", name: "Mariana Gil", email: "domi@burgercore.co", password: "demo", role: "domiciliario", phone: "+57 313 555 0433", vehicle: "Moto AKT — PLA-23H", status: "Activo", document_id: "1035678901", vehicle_type: "Motocicleta", vehicle_plate: "PLA-23H", vehicle_description: "Moto AKT NKD 125 Roja", emergency_contact_name: "Pedro Gil", emergency_contact_phone: "+57 310 222 3344" },
  { id: "USR-05", name: "Juan Pablo Montoya", email: "jp@burgercore.co", password: "demo", role: "cliente", phone: "+57 315 555 0544", status: "Activo" },
  { id: "USR-06", name: "Sebastián Cárdenas", email: "seba@burgercore.co", password: "demo", role: "domiciliario", phone: "+57 316 555 0655", vehicle: "Bici eléctrica — BIC-09", status: "Activo", document_id: "1020456789", vehicle_type: "Bicicleta", vehicle_description: "Bici eléctrica GW negra", emergency_contact_name: "María Cárdenas", emergency_contact_phone: "+57 311 333 4455" },
  { id: "USR-07", name: "Valeria Ospina", email: "vale@burgercore.co", password: "demo", role: "cliente", phone: "+57 317 555 0766", status: "Suspendido" },
  { id: "USR-08", name: "Sede El Poblado", email: "poblado@burgercore.co", password: "demo", role: "admin", phone: "+57 604 555 0877", status: "Activo" },
];