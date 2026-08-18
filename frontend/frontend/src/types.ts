// src/types.ts

export interface Place {
  id: number;
  name: string;
  type: string | null;
  capacity: number;
  length_m?: number | null;
  price_per_night: number;
}

export interface Booking {
  id: number;
  place_id: number;
  booking_number?: string | null;
  start_date: string;
  end_date: string;
  guest_name: string;
  guest_street?: string | null;
  guest_postal_code?: string | null;
  guest_city?: string | null;
  nationality?: string | null;
  people_count?: number;
  adult_count?: number;
  child_count?: number;
  day_visitor_count?: number;
  has_electricity?: boolean;
  has_waste?: boolean;
  has_rhine_view?: boolean;
  dog_count?: number;
  car_count?: number;
  motorcycle_count?: number;
  camper_count?: number;
  camper_length_m?: number | null;
  tent_tariff_code?: string | null;
  place_price_per_night?: number;
  vehicle_size?: string;
  tent_count?: number | null;
  notes?: string;
  status?: string;
  created_by?: string;
}

export interface BookingReceiptItem {
  description: string;
  quantity: number;
  unit: string;
  tariff_code?: string | null;
  unit_price: number;
  total: number;
}

export interface Tariff {
  id: number;
  code: string;
  label: string;
  unit: string;
  price: number;
  valid_from: string;
  valid_to?: string | null;
}

export interface BookingQuote {
  nights: number;
  days: number;
  items: BookingReceiptItem[];
  total: number;
}

export interface BookingReceipt {
  booking_id: number;
  booking_number: string;
  guest: {
    name: string;
    street?: string | null;
    postal_code?: string | null;
    city?: string | null;
    nationality?: string | null;
  };
  stay: {
    start_date: string;
    end_date: string;
    nights: number;
  };
  place: {
    id: number;
    name: string;
    type: string | null;
  };
  booking_info: {
    adult_count: number;
    child_count: number;
    day_visitor_count: number;
    car_count: number;
    motorcycle_count: number;
    camper_count: number;
    camper_length_m?: number | null;
    dog_count: number;
    has_electricity: boolean;
    has_waste: boolean;
    has_rhine_view: boolean;
    vehicle_size?: string | null;
    notes?: string | null;
    created_by?: string | null;
  };
  prices: {
    applied_tariff_codes: string[];
  };
  items: BookingReceiptItem[];
  total: number;
}

export type PlaceStatusColor =
  | "green"
  | "yellow"
  | "red"
  | "gray"
  | "blocked";

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
  length_m?: number | null;
  price_per_night?: number;
}

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface CurrentUser {
  username: string;
  role: string;
}

export interface BackupFileMeta {
  file_name: string;
  size_bytes: number;
  created_at: string;
}

export interface BackupRestoreResponse {
  message: string;
  restored_file: string;
  safety_backup_file: string;
}

