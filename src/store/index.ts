import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import sessionSlice from "@/features/session/store/sessionSlice";
import workoutSlice from "@/features/workout/store/workoutSlice";
import userSlice from "@/features/user/store/userSlice";
import liveSessionSlice from "@/features/session/store/liveSessionSlice";
import uiSlice from "@/features/ui/store/uiSlice";
import formCorrectionSlice from "@/features/form-correction/store/formCorrectionSlice";
import safetyOverrideSlice from "@/features/safety-override/store/safetyOverrideSlice";
import injuryAwareSlice from "@/features/injury-aware/store/injuryAwareSlice";
import unifiedCoachingSlice from "./unifiedCoachingSlice";
import preferenceLearningSlice from "./preferenceLearningSlice";

const rootReducer = combineReducers({
  session: sessionSlice,
  liveSession: liveSessionSlice,
  workout: workoutSlice,
  user: userSlice,
  ui: uiSlice,
  formCorrection: formCorrectionSlice,
  safetyOverride: safetyOverrideSlice,
  injuryAware: injuryAwareSlice,
  unifiedCoaching: unifiedCoachingSlice,
  preferenceLearning: preferenceLearningSlice,
});

const persistConfig = {
  key: "root",
  storage,
   whitelist: ["user", "workout", "session", "formCorrection", "safetyOverride", "injuryAware", "unifiedCoaching", "preferenceLearning"], // Persist important data
  // ui slice is transient
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
