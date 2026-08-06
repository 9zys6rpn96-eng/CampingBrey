import { useEffect, useState } from "react";
import type { Place, Booking, PlaceStatus, User } from "../types";
import {
  fetchPlaces,
  fetchBookings,
  fetchPlaceStatuses,
  fetchUsers,
} from "../services/api";

interface BookingDataState {
  places: Place[];
  bookings: Booking[];
  placeStatuses: PlaceStatus[];
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: BookingDataState = {
  places: [],
  bookings: [],
  placeStatuses: [],
  users: [],
  loading: false,
  error: null,
};

export function useBookingData(currentUser: { username: string; role: string } | null, todayIso: string) {
  const [state, setState] = useState<BookingDataState>(initialState);

  const loadData = async () => {
    if (!currentUser) {
      setState(initialState);
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const [placesData, bookingsData, statusData] = await Promise.all([
        fetchPlaces(),
        fetchBookings(),
        fetchPlaceStatuses(todayIso, todayIso),
      ]);

      let usersData: User[] = [];
      if (currentUser.role === "developer") {
        try {
          usersData = await fetchUsers();
        } catch (err) {
          console.warn("Failed to load users:", err);
        }
      }

      setState({
        places: placesData,
        bookings: bookingsData,
        placeStatuses: statusData,
        users: usersData,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Fehler beim Laden der Daten",
      }));
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, todayIso]);

  return { ...state, reload: loadData };
}

