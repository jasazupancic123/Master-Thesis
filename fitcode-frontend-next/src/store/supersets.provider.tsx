import { createContext, useContext } from 'react';

import type { ChildrenProps } from '@/common/type/props.type';
import type { SetState } from '@/common/type/state.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

type SupersetsContextInputProps = {
  expandedExercisesView: boolean;
  setExpandedExercisesView: SetState<boolean>;
  selectedExercise: TrainingExercise | null;
  setSelectedExercise: SetState<TrainingExercise | null>;
  menuExercise: TrainingExercise | null;
  setMenuExercise: SetState<TrainingExercise | null>;
  openVideoPlayerModal: boolean;
  setOpenVideoPlayerModal: SetState<boolean>;
  openAddExerciseModal: boolean;
  setOpenAddExerciseModal: SetState<boolean>;
  setsNumbers: {
    exerciseId: string;
    setsNumber: number;
  }[];
  setSetsNumbers: SetState<
    {
      exerciseId: string;
      setsNumber: number;
    }[]
  >;
};

type SupersetsContextProps = SupersetsContextInputProps & {
  handleMenuClose: () => void;
};

const SupersetsContext = createContext<SupersetsContextProps | null>(null);

export const useSupersets = () => useContext(SupersetsContext)!;

export function SupersetsProvider(
  props: SupersetsContextInputProps & ChildrenProps
) {
  const {
    children,
    expandedExercisesView,
    setExpandedExercisesView,
    selectedExercise,
    setSelectedExercise,
    menuExercise,
    setMenuExercise,
    openVideoPlayerModal,
    setOpenVideoPlayerModal,
    openAddExerciseModal,
    setOpenAddExerciseModal,
    setsNumbers,
    setSetsNumbers,
  } = props;

  const handleMenuClose = () => {
    setMenuExercise(null);
  };

  const value: SupersetsContextProps = {
    expandedExercisesView,
    setExpandedExercisesView,
    selectedExercise,
    setSelectedExercise,
    menuExercise,
    setMenuExercise,
    openVideoPlayerModal,
    setOpenVideoPlayerModal,
    openAddExerciseModal,
    setOpenAddExerciseModal,
    setsNumbers: setsNumbers,
    setSetsNumbers: setSetsNumbers,
    handleMenuClose,
  };

  return (
    <SupersetsContext.Provider value={value}>
      {children}
    </SupersetsContext.Provider>
  );
}
