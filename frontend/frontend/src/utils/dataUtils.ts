/**
 * Utility functions for data handling
 */

import type { Booking, Place } from "../types";

export function getStatusLabel(status?: string): string {
  if (status === "noshow") return "Nicht erschienen";
  if (status === "cancelled") return "Storniert";
  return "Aktiv";
}

export function getPlaceTypeLabel(type?: string | null): string {
  if (!type) return "Stellplatz";
  return type;
}

export function getPlaceName(
  placeId: number,
  places: Place[]
): string {
  return places.find((p) => p.id === placeId)?.name ?? `ID ${placeId}`;
}

export function escapeCsvValue(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function sortPlacesByName(places: Place[]): Place[] {
  return [...places].sort((a, b) => {
    const regex = /^(\d+)([a-zA-Z]*)$/;

    const matchA = a.name.match(regex);
    const matchB = b.name.match(regex);

    if (matchA && matchB) {
      const numA = parseInt(matchA[1], 10);
      const numB = parseInt(matchB[1], 10);

      if (numA !== numB) {
        return numA - numB;
      }

      const suffixA = matchA[2] || "";
      const suffixB = matchB[2] || "";

      return suffixA.localeCompare(suffixB);
    }

    return a.name.localeCompare(b.name);
  });
}

export function sortBookingsByDate(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) =>
    a.start_date.localeCompare(b.start_date)
  );
}

