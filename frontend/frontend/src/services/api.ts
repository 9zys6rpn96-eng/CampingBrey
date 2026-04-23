import type { Place, Booking, PlaceStatus } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function getAuthToken() {
  return localStorage.getItem("auth_token");
}

async function apiGet<T>(path: string): Promise<T> {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Unbekannter Fehler");
  }

  return res.json();
}

export async function login(username: string, password: string) {
  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);

  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Login fehlgeschlagen");
  }

  return res.json();
}

export async function fetchMe(): Promise<{ username: string; role: string }> {
  return apiGet<{ username: string; role: string }>("/me");
}

export async function fetchPlaces(): Promise<Place[]> {
  return apiGet<Place[]>("/places");
}

export async function fetchBookings(): Promise<Booking[]> {
  return apiGet<Booking[]>("/bookings");
}

export async function fetchPlaceStatuses(
  startDate: string,
  endDate: string
): Promise<PlaceStatus[]> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  return apiGet<PlaceStatus[]>(`/places/status?${params.toString()}`);
}

export async function createBooking(data: {
  place_id: number;
  start_date: string;
  end_date: string;
  guest_name: string;
  vehicle_size: string;
  notes: string;
}) {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Fehler beim Erstellen der Buchung");
  }

  return res.json();
}

export async function deleteBooking(bookingId: number) {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
    method: "DELETE",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Fehler beim Löschen der Buchung");
  }

  return res.json();
}

export async function updatePlace(
  id: number,
  data: { name: string; type: string; capacity: number }
) {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE_URL}/places/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Fehler beim Aktualisieren des Platzes");
  }

  return res.json();
}

export async function createUser(data: {
  username: string;
  password: string;
  role: string;
}) {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Fehler beim Erstellen des Users");
  }

  return res.json();
}
