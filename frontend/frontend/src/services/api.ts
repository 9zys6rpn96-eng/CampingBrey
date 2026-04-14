// src/services/api.ts
import type { Place, Booking } from "../types";

const API_BASE = "http://127.0.0.1:8000";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Unbekannter Fehler");
}
  return res.json();
}

export async function fetchPlaces(): Promise<Place[]> {
  return apiGet<Place[]>("/places");
}

export async function fetchBookings(): Promise<Booking[]> {
  return apiGet<Booking[]>("/bookings");
}

export async function createBooking(data: {
  place_id: number;
  start_date: string;
  end_date: string;
}) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Fehler beim Erstellen der Buchung");
  }

  return res.json();
}

export async function deleteBooking(bookingId: number) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Fehler beim Löschen der Buchung");
  }

  return res.json();
}