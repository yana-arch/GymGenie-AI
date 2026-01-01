# 8. Common Tasks (Cookbook)

This cookbook provides step-by-step recipes for common development tasks in GymGenie.

### How to Add a New Tab to the Main Navigation

1.  **Define the View Key**: Add a new key to the `View` type in [`context/AppContext.tsx`](../../context/AppContext.tsx).
    ```typescript
    // In context/AppContext.tsx
    export type View = 'dashboard' | 'progress' | 'profile' | 'kitchen' | 'newTab';
    ```

2.  **Add Nav Item**: Add a new `DashboardNavItem` to the `navItems` array in [`components/dashboard/DashboardBottomNav.tsx`](../../components/dashboard/DashboardBottomNav.tsx). This will make it appear on the mobile bottom navigation.
    ```tsx
    // In components/dashboard/DashboardBottomNav.tsx
    const navItems = [
      // ... existing items
      { view: 'newTab', label: 'New Tab', icon: <YourIconComponent /> },
    ];
    ```
    Do the same for the desktop header in [`components/dashboard/DashboardHeader.tsx`](../../components/dashboard/DashboardHeader.tsx).

3.  **Create the Feature Component**: Create a new feature folder, e.g., `src/features/new-tab/`, with its main component, e.g., `NewTabScreen.tsx`.

4.  **Render the Component**: In the main [`App.tsx`](../../App.tsx), add a case to the main `switch` statement (or equivalent logic) to render your new component when `activeView` is `'newTab'`.

### How to Add a Redux Thunk that Uses a Service

1.  **Create the Thunk**: In your feature's slice file (e.g., `workoutSlice.ts`), create an async thunk. The thunk receives `getState` and `dispatch` as arguments, but also a third argument which is the `extra` argument from the Redux middleware, which we have configured to be our DI container.
2.  **Get the Service**: Inside the thunk, get the required service from the container.
3.  **Implement Logic**: Call the service method, and dispatch actions based on the result.

    ```typescript
    // In src/features/workout/store/workoutSlice.ts
    import { AppThunk } from '../../../../store';
    import { IWorkoutService } from '../../../../services/interfaces/IWorkoutService';

    export const generateNewPlan = (prompt: string): AppThunk =>
      async (dispatch, getState, { container }) => {
        try {
          dispatch(planGenerationStarted());
          const workoutService = container.get<IWorkoutService>('IWorkoutService');
          const newPlan = await workoutService.generatePlan(prompt);
          dispatch(planGenerationSucceeded(newPlan));
        } catch (error) {
          dispatch(planGenerationFailed(error.message));
        }
      };
    ```

### How to Add a New Chart

1.  **Choose a Library**: We use `recharts` for charting.
2.  **Create the Component**: Create a new component for your chart, e.g., `MyNewChart.tsx`.
3.  **Fetch and Prepare Data**:
    *   Use a `useSelector` hook to get the necessary data from the Redux store.
    *   Use `useMemo` to transform the data into the format required by `recharts` (e.g., an array of objects like `[{ name: 'Week 1', volume: 5000 }, ...]`). This is crucial for performance, as it prevents recalculation on every render.
4.  **Render the Chart**: Use `recharts` components (`<BarChart>`, `<LineChart>`, `<XAxis>`, etc.) to build your chart. Make sure it's wrapped in `<ResponsiveContainer>` to make it responsive.
5.  **Handle Empty State**: If the data array is empty, render an "empty state" component instead of an empty chart.

### How to Add a New Slice

1.  **Create the Slice File**: In your new feature's `store` directory, create a file like `newSlice.ts`.
2.  **Define State and Create Slice**: Define the shape of your state `interface NewState { ... }` and use `createSlice` from Redux Toolkit.
    ```typescript
    // In src/features/my-feature/store/newSlice.ts
    import { createSlice, PayloadAction } from '@reduxjs/toolkit';

    interface NewState {
      value: number;
    }

    const initialState: NewState = {
      value: 0,
    };

    const newSlice = createSlice({
      name: 'newFeature',
      initialState,
      reducers: {
        increment(state) {
          state.value++;
        },
        // ... other reducers
      },
    });

    export const { increment } = newSlice.actions;
    export default newSlice.reducer;
    ```
3.  **Add to Root Reducer**: In [`store/index.ts`](../../store/index.ts), import your new reducer and add it to the `combineReducers` call in the `rootReducer`.

    ```typescript
    // In store/index.ts
    import newReducer from '../features/my-feature/store/newSlice';

    const rootReducer = combineReducers({
      // ... other reducers
      newFeature: newReducer,
    });
    ```
