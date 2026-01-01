import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import VirtualizedExerciseList from './VirtualizedExerciseList';
import { VirtualizedExerciseListProps } from './VirtualizedExerciseList';

const VirtualizedExerciseListWrapper: React.FC<VirtualizedExerciseListProps> = (props) => {
  return (
    <Provider store={store}>
      <VirtualizedExerciseList {...props} />
    </Provider>
  );
};

export default VirtualizedExerciseListWrapper;