import { SetState } from '@/common/type/state.type';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { createContext, useContext, useState } from 'react';
import { ChildrenProps } from '@/common/type/props.type';

type SupersetsContextInputProps = {
  expandedExercisesView: boolean;
  setExpandedExercisesView: SetState<boolean>;
  selectedExercise: TrainingExercise | null;
  setSelectedExercise: SetState<TrainingExercise | null>;
  menuExercise: TrainingExercise | null;
  setMenuExercise: SetState<TrainingExercise | null>;
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
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
    anchorEl,
    setAnchorEl,
    openVideoPlayerModal,
    setOpenVideoPlayerModal,
    openAddExerciseModal,
    setOpenAddExerciseModal,
    setsNumbers,
    setSetsNumbers,
  } = props;

  const handleMenuClose = () => {
    setMenuExercise(null);
    setAnchorEl(null);
  };

  const value: SupersetsContextProps = {
    expandedExercisesView,
    setExpandedExercisesView,
    selectedExercise,
    setSelectedExercise,
    menuExercise,
    setMenuExercise,
    anchorEl,
    setAnchorEl,
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
