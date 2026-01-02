import React, { PropsWithChildren } from 'react';
import { render as rtlRender } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

import type { RootState } from '../store';
import { AppProvider } from '../context/AppContext';
import sessionSlice from '../src/features/session/store/sessionSlice';
import workoutSlice from '../src/features/workout/store/workoutSlice';
import userSlice from '../src/features/user/store/userSlice';
import uiSlice from '../src/features/ui/store/uiSlice';
import { JSX } from 'react/jsx-dev-runtime';

const rootReducer = {
  session: sessionSlice,
  workout: workoutSlice,
  user: userSlice,
  ui: uiSlice,
};

export const setupStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
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