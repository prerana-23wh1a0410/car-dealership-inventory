export type VehicleType = "Sedan" | "SUV" | "Truck" | "Coupe" | "Convertible" | "Electric";

export const VEHICLE_TYPES: VehicleType[] = ["Sedan", "SUV", "Truck", "Coupe", "Convertible", "Electric"];

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  type: VehicleType;
  fuel: string;
  transmission: string;
  mileage: number;
  color: string;
  stock: number;
  sold: number;
  image: string;
}

/** Payload for creating/updating a vehicle (server assigns id, sold starts at 0). */
export type VehicleInput = Omit<Vehicle, "id" | "sold">;

export type Role = "admin" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Order {
  id: string;
  vehicleId: string;
  userId: string;
  quantity: number;
  total: number;
  date: string;
}

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
