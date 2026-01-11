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
import historicalPatternsSlice from "./historicalPatternsSlice";
import { feedbackPersonalizationReducer } from "@/features/feedback-driven-personalization/store/feedbackPersonalizationSlice";
import privacyReducer from "@/features/privacy/store/privacySlice";
import achievementReducer from "@/features/analytics/store/achievementSlice";
import analyticsReducer from "@/features/analytics/store/analyticsSlice";
import { secureStorage } from "@/features/privacy/services/SecureStorage";
import { preferenceLearningMiddleware } from "./middleware/preferenceLearningMiddleware";

import featureFlagSlice from "@/features/ui/store/featureFlagSlice";
import { migrate } from "./migrations";

const rootReducer = combineReducers({
  session: sessionSlice,
  liveSession: liveSessionSlice,
  workout: workoutSlice,
  user: userSlice,
  ui: uiSlice,
  featureFlags: featureFlagSlice,
  formCorrection: formCorrectionSlice,
  safetyOverride: safetyOverrideSlice,
  injuryAware: injuryAwareSlice,
  unifiedCoaching: unifiedCoachingSlice,
  preferenceLearning: preferenceLearningSlice,
  historicalPatterns: historicalPatternsSlice,
  feedbackPersonalization: feedbackPersonalizationReducer,
  privacy: privacyReducer,
  achievement: achievementReducer,
  analytics: analyticsReducer,
});

const persistConfig = {
  key: "root",
  version: 1,
  storage: secureStorage,
  migrate,
  whitelist: ["user", "workout", "session", "liveSession", "featureFlags", "formCorrection", "safetyOverride", "injuryAware", "unifiedCoaching", "preferenceLearning", "historicalPatterns", "feedbackPersonalization", "privacy", "achievement", "analytics"], // Persist important data
  // ui slice is transient
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ['feedbackPersonalization.service'],
      },
    }).concat(preferenceLearningMiddleware),
  devTools: process.env.NODE_ENV !== "production",
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
