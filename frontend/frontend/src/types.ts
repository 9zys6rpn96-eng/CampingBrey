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
  start_date: string; // als ISO-String aus der API
  end_date: string;
}
