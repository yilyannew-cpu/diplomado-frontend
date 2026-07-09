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
  avatar?: string;
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
  { id: "USR-01", name: "Laura Martínez", email: "cliente1@ffcore.co", password: "demo", role: "cliente", phone: "+57 310 555 0102", status: "Activo" },
  { id: "USR-02", name: "Carlos Restrepo", email: "admin1@ffcore.co", password: "demo", role: "admin", phone: "+57 311 555 0211", status: "Activo" },
  { id: "USR-03", name: "Ana Lucía Vélez", email: "super@ffcore.co", password: "demo", role: "superadmin", phone: "+57 312 555 0322", status: "Activo" },
  { id: "USR-04", name: "Mariana Gil", email: "domi1@ffcore.co", password: "demo", role: "domiciliario", phone: "+57 313 555 0433", vehicle: "Moto AKT — PLA-23H", status: "Activo", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&h=200&q=80", document_id: "1035678901", vehicle_type: "Motocicleta", vehicle_plate: "PLA-23H", vehicle_description: "Moto AKT NKD 125 Roja", emergency_contact_name: "Pedro Gil", emergency_contact_phone: "+57 310 222 3344" },
  { id: "USR-05", name: "Juan Pablo Montoya", email: "cliente2@ffcore.co", password: "demo", role: "cliente", phone: "+57 315 555 0544", status: "Activo" },
  { id: "USR-06", name: "Seba Courier", email: "domi2@ffcore.co", password: "demo", role: "domiciliario", phone: "+57 316 555 0655", vehicle: "Bici eléctrica — BIC-09", status: "Activo", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80", document_id: "1020456789", vehicle_type: "Bicicleta", vehicle_description: "Bici eléctrica GW negra", emergency_contact_name: "María Pérez", emergency_contact_phone: "+57 311 333 4455" },
  { id: "USR-06B", name: "Camilo Repartidor", email: "domi3@ffcore.co", password: "demo", role: "domiciliario", phone: "+57 318 555 0999", vehicle: "Moto Yamaha — XYZ-123", status: "Activo", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80", document_id: "1055555555", vehicle_type: "Motocicleta", vehicle_plate: "XYZ-123", vehicle_description: "Yamaha FZ negra", emergency_contact_name: "Luisa Fernández", emergency_contact_phone: "+57 312 444 5566" },
  { id: "USR-07", name: "Valeria Ospina", email: "cliente3@ffcore.co", password: "demo", role: "cliente", phone: "+57 317 555 0766", status: "Suspendido" },
  { id: "USR-08", name: "Sede Caobos", email: "admin2@ffcore.co", password: "demo", role: "admin", phone: "+57 607 555 0877", status: "Activo" },
  { id: "USR-09", name: "Sede Centro", email: "admin3@ffcore.co", password: "demo", role: "admin", phone: "+57 607 555 0888", status: "Activo" },
];