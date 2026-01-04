import React, { PropsWithChildren, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import { registerServices } from '@/services/container/serviceRegistration';
import { Loader2 } from 'lucide-react';

interface ReduxProviderProps extends PropsWithChildren {
  // Additional props can be added here if needed
}

/**
 * Redux Provider component that wraps the app with Redux store,
 * manages persistence rehydration, and initializes the service layer.
 */
export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize service layer when Redux provider mounts
    registerServices();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
            <Loader2 className="animate-spin text-brand-600" size={48} />
          </div>
        } 
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
};