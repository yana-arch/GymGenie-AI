import React, { PropsWithChildren } from 'react';
import { render as rtlRender } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
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
import storage from "redux-persist/lib/storage";

import type { RootState } from '../src/store';
import { AppProvider } from '../src/context/AppContext';
import sessionSlice from '../src/features/session/store/sessionSlice';
import workoutSlice from '../src/features/workout/store/workoutSlice';
import userSlice from '../src/features/user/store/userSlice';
import uiSlice from '../src/features/ui/store/uiSlice';
import { JSX } from 'react/jsx-dev-runtime';

const rootReducer = combineReducers({
  session: sessionSlice,
  workout: workoutSlice,
  user: userSlice,
  ui: uiSlice,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user", "workout", "session"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const setupStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: persistedReducer,
    preloadedState,
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
          {children}
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
