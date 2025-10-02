import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  place_url?: string;
  category?: string;
}

interface PlaceState {
  places: Place[];
  currentLocation: string | null;
  loadingPlaces: boolean;
}

const initialState: PlaceState = {
  places: [],
  currentLocation: null,
  loadingPlaces: false,
};

const placeSlice = createSlice({
  name: "place",
  initialState,
  reducers: {
    setPlaces(state, action: PayloadAction<Place[]>) {
      state.places = action.payload;
    },
    setCurrentLocation(state, action: PayloadAction<string | null>) {
      state.currentLocation = action.payload;
    },
    setLoadingPlaces(state, action: PayloadAction<boolean>) {
      state.loadingPlaces = action.payload;
    },
  },
});

export const { setPlaces, setCurrentLocation, setLoadingPlaces } =
  placeSlice.actions;
export default placeSlice.reducer;
