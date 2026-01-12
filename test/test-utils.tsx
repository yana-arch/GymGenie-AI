import React, { PropsWithChildren } from 'react';
import { render as rtlRender } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import type { RootState } from '../src/store';
import { AppProvider } from '../src/context/AppContext';
import { MantineProvider, createTheme } from '@mantine/core';
import sessionSlice from '../src/features/session/store/sessionSlice';
import workoutSlice from '../src/features/workout/store/workoutSlice';
import userSlice from '../src/features/user/store/userSlice';
import uiSlice from '../src/features/ui/store/uiSlice';
import liveSessionSlice from '../src/features/session/store/liveSessionSlice';
import formCorrectionSlice from '../src/features/form-correction/store/formCorrectionSlice';
import safetyOverrideSlice from '../src/features/safety-override/store/safetyOverrideSlice';
import injuryAwareSlice from '../src/features/injury-aware/store/injuryAwareSlice';
import achievementSlice from '../src/features/analytics/store/achievementSlice';
import featureFlagSlice from '../src/features/ui/store/featureFlagSlice';
import { JSX } from 'react/jsx-dev-runtime';

const theme = createTheme({
  primaryColor: 'blue',
});

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
  achievement: achievementSlice,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user", "workout", "session", "liveSession", "featureFlags", "formCorrection", "safetyOverride", "injuryAware", "achievement"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const setupStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: persistedReducer,
    preloadedState: preloadedState as any,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });
};

type AppStore = ReturnType<typeof setupStore>;

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
}

function render(
  ui: React.ReactElement,
  {
    preloadedState,
    store = setupStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return (
      <Provider store={store}>
        <AppProvider>
          <MantineProvider theme={theme}>
            {children}
          </MantineProvider>
        </AppProvider>
      </Provider>
    );
  }

  return { store, ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
// Override the render method with our own
export { render };
