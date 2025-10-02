import { configureStore } from "@reduxjs/toolkit";
import mapReducer from "./mapSlice";
import placeReducer from "./placeSlice";

export const store = configureStore({
  reducer: {
    map: mapReducer,
    place: placeReducer,
  },
});

// TS용 타입
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
