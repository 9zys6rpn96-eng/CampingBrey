import { useState } from "react";
import type { Place } from "../types";
import { fetchAvailablePlaces } from "../services/api";

interface AvailabilitySearchState {
  availablePlaces: Place[];
  vehicleLengthM: string;
  error: string | null;
  loading: boolean;
}

export function useAvailabilitySearch() {
  const [state, setState] = useState<AvailabilitySearchState>({
    availablePlaces: [],
    vehicleLengthM: "",
    error: null,
    loading: false,
  });

  const search = async (startDate: string, endDate: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const length =
        state.vehicleLengthM.trim() === ""
          ? undefined
          : Number(state.vehicleLengthM);

      const result = await fetchAvailablePlaces(startDate, endDate, length);

      setState((prev) => ({
        ...prev,
        availablePlaces: result,
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Fehler bei der Verfügbarkeitssuche",
        loading: false,
      }));
    }
  };

  const clear = () => {
    setState({
      availablePlaces: [],
      vehicleLengthM: "",
      error: null,
      loading: false,
    });
  };

  const setVehicleLength = (length: string) => {
    setState((prev) => ({ ...prev, vehicleLengthM: length }));
  };

  return { ...state, search, clear, setVehicleLength };
}

