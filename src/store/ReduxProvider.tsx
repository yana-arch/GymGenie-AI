import React, { PropsWithChildren, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { registerServices } from '@/services/container/serviceRegistration';

interface ReduxProviderProps extends PropsWithChildren {
  // Additional props can be added here if needed
}

/**
 * Redux Provider component that wraps the app with Redux store
 * and initializes the service layer
 */
export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize service layer when Redux provider mounts
    registerServices();
  }, []);

  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
};