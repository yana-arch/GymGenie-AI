import { createMigrate } from 'redux-persist';

/**
 * Redux Persist Migrations
 * Handle state schema changes safely across versions
 */
export const migrations: any = {
  // Version 1: Initial versioned state
  1: (state: any) => {
    // No changes needed yet, just establishing the version
    return {
      ...state,
    };
  },
};

export const migrate = createMigrate(migrations, { debug: process.env.NODE_ENV !== 'production' });
