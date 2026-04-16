// src/types.ts

export interface Place {
  id: number;
  name: string;
  type: string | null;
  capacity: number;
}

export interface Booking {
  id: number;
  place_id: number;
  start_date: string;
  end_date: string;
  guest_name: string;
  vehicle_size: string | null;
  notes: string | null;
}

export type PlaceStatusColor = "green" | "yellow" | "red" | "gray";

export interface PlaceStatus {
  id: number;
  name: string;
  type: string | null;
  capacity: number;
  start_date: string;
  end_date: string;
  max_occupancy: number;
  occupied_days: number;
  fully_booked_days: number;
  status: PlaceStatusColor;
}
