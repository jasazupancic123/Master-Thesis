import { createContext, useContext, useState } from 'react';

import type { ChildrenProps } from '@/common/type/props.type';
import type { SetState } from '@/common/type/state.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { ParamType } from '@/controller/component/enum/param.enum';
import { Attribute } from '@/controller/attribute/type/attribute.type';

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
  openNumericInput: boolean;
  setOpenNumericInput: SetState<boolean>;
  numericInputAnchorEl: null | HTMLElement;
  setNumericInputAnchorEl: SetState<null | HTMLElement>;
  selectedNumericInputParam: (Attribute & { selected?: string }) | null;
  setSelectedNumericInputParam: SetState<
    (Attribute & { selected?: string }) | null
  >;
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

  const [openNumericInput, setOpenNumericInput] = useState(false);
  const [numericInputAnchorEl, setNumericInputAnchorEl] =
    useState<null | HTMLElement>(null);
  const [selectedNumericInputParam, setSelectedNumericInputParam] = useState<
    (Attribute & { selected?: string }) | null
  >(null);

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
    openNumericInput,
    setOpenNumericInput,
    numericInputAnchorEl,
    setNumericInputAnchorEl,
    selectedNumericInputParam,
    setSelectedNumericInputParam,
  };

  return (
    <SupersetsContext.Provider value={value}>
      {children}
    </SupersetsContext.Provider>
  );
}
