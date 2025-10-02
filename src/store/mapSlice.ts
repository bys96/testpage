import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface MapState {
  map: any | null;
  markers: any[];
  selectedMarker: any | null;
  currentMarker: any | null;
}

const initialState: MapState = {
  map: null,
  markers: [],
  selectedMarker: null,
  currentMarker: null,
};

const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    setMap(state, action: PayloadAction<any>) {
      state.map = action.payload;
    },
    setMarkers(state, action: PayloadAction<any[]>) {
      state.markers = action.payload;
    },
    setSelectedMarker(state, action: PayloadAction<any | null>) {
      state.selectedMarker = action.payload;
    },
    setCurrentMarker(state, action: PayloadAction<any | null>) {
      state.currentMarker = action.payload;
    },
  },
});

export const { setMap, setMarkers, setSelectedMarker, setCurrentMarker } =
  mapSlice.actions;
export default mapSlice.reducer;
