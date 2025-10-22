import { createContext, useContext } from 'react';

import { useMain } from './main.provider';
import { useTrainerDayView } from './trainer-day-view.provider';
import { core } from '@/core/core.service';
import type { ExerciseParamField } from '@/core/training/type/exercise-set.type';
import type { Superset } from '@/core/training/type/superset.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';

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
};

type SupersetsContextProps = SupersetsContextInputProps & {
  handleMenuClose: () => void;
  updateTrainingExercises: (exercises: TrainingExercise[]) => void;
  updateTrainingExerciseParam: (
    exercise: TrainingExercise,
    field: ExerciseParamField,
    value: number | string,
    setIndex?: number
  ) => void;
};

const SupersetsContext = createContext<SupersetsContextProps | null>(null);

export type SupersetsProviderReturnType = ReturnType<typeof useSupersets>;

export const useSupersets = () => useContext(SupersetsContext)!;

export function SupersetsProvider(
  props: SupersetsContextInputProps & React.PropsWithChildren
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
  } = props;

  const {
    component,
    setComponent,
    training,
    setTraining,
    selectedSubgroup,
    setSelectedSubgroup,
    setSupersets,
    selectedExerciseIds,
  } = useTrainerDayView();

  const { exercises: allExercises } = useMain();

  const handleMenuClose = () => setMenuExercise(null);

  function updateTrainingExercises(exercises: TrainingExercise[]) {
    if (!component || !training) return;

    let updatedSupersets: Superset[] = [];
    for (const exercise of exercises)
      updatedSupersets = core.training.superset.updateExercise(exercise, {
        training,
        componentId: component.id,
        subgroupId: selectedSubgroup?.id,
      });

    const newTraining = structuredClone(training);
    const updatedComponent = newTraining.components.find(
      (c) => c.id === component.id
    );

    const updatedSubgroup =
      updatedComponent?.subgroups.find(
        (sg) => sg.id === selectedSubgroup?.id
      ) || null;

    setSupersets(updatedSupersets);
    setSelectedSubgroup(updatedSubgroup);
    setComponent(updatedComponent);
    setTraining(newTraining);
  }

  function updateTrainingExerciseParam(
    exercise: TrainingExercise,
    field: ExerciseParamField,
    value: number | string,
    setIndex?: number
  ) {
    if (!component || !training) return;

    const trainingExercises = core.training.getExercises(training, {
      componentId: component.id,
      subgroupId: selectedSubgroup?.id,
    });

    const exercises = trainingExercises
      .filter((e) => selectedExerciseIds.includes(e.id))
      .filter((e) => e.id !== exercise.id); // exclude current exercise

    exercises.push(exercise); // add new updated exercise

    // update all selected exercises with the param change
    for (const e of exercises) {
      const foundExercise = allExercises.find((ex) => ex.id === e.id);
      if (!foundExercise) continue;

      switch (field) {
        case 'sets':
          // special case for sets, we need to add or remove sets
          const sets = value as number;
          const prevSets = e.sets?.length || 0;
          if (setIndex !== undefined) break; // we only allow updating sets as a whole, not by index separately

          if (prevSets > +sets && +sets > 0)
            e.sets = [...e.sets].slice(0, +sets); // remove sets
          else {
            e.sets = [
              ...e.sets,
              ...Array(+sets - prevSets).fill(
                e.sets[prevSets - 1] ||
                  core.training.set.stub(prevSets, foundExercise)
              ),
            ];
          }

          break;
        default:
          break;
      }

      if (setIndex === undefined)
        e.sets = e.sets.map((s) => ({ ...s, [field]: value })); // update all sets
      else if (e.sets[setIndex])
        e.sets[setIndex] = { ...e.sets[setIndex], [field]: value }; // update provided set
    }

    updateTrainingExercises(exercises);
  }

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
    handleMenuClose,
    updateTrainingExercises,
    updateTrainingExerciseParam,
  };

  return (
    <SupersetsContext.Provider value={value}>
      {children}
    </SupersetsContext.Provider>
  );
}
