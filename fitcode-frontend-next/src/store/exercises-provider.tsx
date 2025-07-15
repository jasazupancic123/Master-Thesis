'use client';

import { ExerciseContextProps, ExercisePageProps } from '@/common/type/exercise-page-props.type';
import { ChildrenProps } from '@/common/type/props.type';
import { createContext, useContext, useState } from 'react';

const ExerciseContext = createContext<ExerciseContextProps | null>(null);

export const useExerciseContext = () => useContext(ExerciseContext)!;

export function ExerciseProvider(props: ExercisePageProps & ChildrenProps) {
  const {
    children,
    components,
    attributes: allAttributes,
    exercises: allExercises,
    profile,
  } = props;

  const [attributes, setAttributes] = useState(allAttributes);
  const [exercises, setExercises] = useState(allExercises);

  const value: ExerciseContextProps = {
    components,
    attributes,
    setAttributes,
    exercises,
    setExercises,
    profile,
  };

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
}
