import { createContext, useContext } from 'react';
import { unstable_batchedUpdates } from 'react-dom';

import { useMain } from './main.provider';
import { useTrainerDayView } from './trainer-day-view.provider';
import { core } from '@/core/core.service';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/core/training/const/warmup-cooldown.const';
import type {
  ExerciseParamField,
  ExerciseParamFieldExtended,
} from '@/core/training/type/exercise-set.type';
import type { Superset } from '@/core/training/type/superset.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';

interface Props extends React.PropsWithChildren {
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
}

interface ISupersetsContext extends Props {
  handleMenuClose: () => void;
  updateTrainingExercises: (
    newTraining: Training,
    exercises: TrainingExercise[],
    options?: { updateSubgroups?: boolean }
  ) => void;
  updateTrainingExerciseParam: (
    exercise: TrainingExercise,
    field: ExerciseParamFieldExtended,
    value: number | string | undefined,
    setIndex?: number,
    options?: { updateSubgroups?: boolean }
  ) => void;
  updateTrainingExerciseParams: (
    exercise: TrainingExercise,
    params: {
      field: ExerciseParamFieldExtended;
      value: number | string | undefined;
      setIndex?: number;
    }[],
    options?: { updateSubgroups?: boolean; updateWholePair?: boolean }
  ) => void;
}

const SupersetsContext = createContext<ISupersetsContext | null>(null);

export const useSupersets = () => useContext(SupersetsContext)!;

export function SupersetsProvider(props: Props) {
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

  function updateTrainingExercises(
    newTraining: Training,
    exercises: TrainingExercise[],
    options?: { updateSubgroups?: boolean }
  ) {
    if (!component || !newTraining) return;

    const newComponent =
      component.id === WARMUP_ID
        ? newTraining.warmup!
        : component.id === COOLDOWN_ID
          ? newTraining.cooldown!
          : newTraining.components.find((c) => c.id === component.id)!;

    if (!newComponent) return;

    if (options?.updateSubgroups) {
      const children = core.training.subgroup.getChildren(component, component);
      for (const child of children) {
        let updatedSupersets: Superset[] = [];
        for (const exercise of exercises)
          updatedSupersets = core.training.superset.updateExercise(exercise, {
            training: newTraining,
            componentId: component.id,
            subgroupId: child.id,
          });

        // update components subgroup
        const subgroup = newComponent.subgroups.find(
          (sg) => sg.id === child.id
        );

        if (subgroup) subgroup.supersets = updatedSupersets;
      }
    }

    let updatedSupersets: Superset[] = [];
    for (const exercise of exercises) {
      updatedSupersets = core.training.superset.updateExercise(exercise, {
        training: newTraining,
        componentId: component.id,
        subgroupId: selectedSubgroup?.id,
      });
    }

    const updatedSubgroup =
      newComponent.subgroups.find((sg) => sg.id === selectedSubgroup?.id) ||
      null;

    unstable_batchedUpdates(() => {
      setSupersets(updatedSupersets);
      setSelectedSubgroup(updatedSubgroup);
      setComponent(newComponent);
      setTraining(newTraining);
    });
  }

  function updateTrainingExerciseParam(
    exercise: TrainingExercise,
    field: ExerciseParamFieldExtended,
    value: number | string | undefined,
    setIndex?: number,
    options?: { updateSubgroups?: boolean }
  ) {
    if (!component || !training) return;

    const newTraining = structuredClone(training);
    const trainingExercises = core.training.getExercises(newTraining, {
      componentId: component.id,
      subgroupId: selectedSubgroup?.id,
    });

    const exercises = trainingExercises
      .filter((e) => selectedExerciseIds.includes(e.id))
      .filter((e) => e.id !== exercise.id); // exclude current exercise

    exercises.push(exercise); // add new updated exercise

    // update all selected exercises with the param change
    for (const e of exercises) {
      const dbExercise = allExercises.find((ex) => ex.id === e.id);
      if (!dbExercise) continue;

      if (field === 'sets') {
        // special case for sets, we need to add or remove sets
        const sets = value as number;
        const prevSets = e.sets?.length || 0;
        if (setIndex !== undefined) break; // we only allow updating sets as a whole, not by index separately

        if (prevSets > +sets && +sets > 0)
          e.sets = [...e.sets].slice(0, +sets); // remove sets
        else
          e.sets = [
            ...e.sets,
            ...Array(+sets - prevSets).fill(
              e.sets[prevSets - 1] ||
                core.training.set.stub(prevSets, dbExercise)
            ),
          ];

        // update set numbers after adding/removing sets
        e.sets = e.sets.map((s, i) => ({ ...s, setNumber: i + 1 }));
      }

      const uni = dbExercise.isUnilateral;
      const pair = uni
        ? core.exercise.param.pairs[field as ExerciseParamField]
        : null;

      if (setIndex === undefined)
        // update all sets
        e.sets = e.sets.map((s) => ({
          ...s,
          [field]: value,
          ...(pair && value === undefined ? { [pair]: value } : {}),
        }));
      else if (e.sets[setIndex])
        // update provided set
        e.sets[setIndex] = {
          ...e.sets[setIndex],
          [field]: value,
          ...(pair && value === undefined ? { [pair]: value } : {}),
        };
    }

    updateTrainingExercises(newTraining, exercises, options);
  }

  // same as updateTrainingExerciseParam but for multiple fields with a single state update
  function updateTrainingExerciseParams(
    exercise: TrainingExercise,
    params: {
      field: ExerciseParamFieldExtended;
      value: number | string | undefined;
      setIndex?: number;
    }[],
    options?: { updateWholePair?: boolean; updateSubgroups?: boolean }
  ) {
    if (!component || !training) return;

    const newTraining = structuredClone(training);
    const trainingExercises = core.training.getExercises(newTraining, {
      componentId: component.id,
      subgroupId: selectedSubgroup?.id,
    });

    const exercises = trainingExercises
      .filter((e) => selectedExerciseIds.includes(e.id))
      .map((e) => structuredClone(e))
      .filter((e) => e.id !== exercise.id); // exclude current exercise

    exercises.push(structuredClone(exercise)); // add new updated exercise

    // update all selected exercises with the param change
    for (const e of exercises) {
      const dbExercise = allExercises.find((ex) => ex.id === e.id);
      if (!dbExercise) continue;

      for (const param of params) {
        const { field, value, setIndex } = param;
        if (field === 'sets') {
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
                  core.training.set.stub(prevSets, dbExercise)
              ),
            ];
          }
        }

        const uni = dbExercise.isUnilateral;
        const pair = uni
          ? core.exercise.param.pairs[field as ExerciseParamField]
          : null;

        const updatePairObject =
          pair && options?.updateWholePair ? { [pair]: value } : {};

        if (setIndex === undefined)
          // update all sets
          e.sets = e.sets.map((s) => ({
            ...s,
            [field]: value,
            ...updatePairObject,
          }));
        else if (e.sets[setIndex])
          // update provided set
          e.sets[setIndex] = {
            ...e.sets[setIndex],
            [field]: value,
            ...updatePairObject,
          };
      }
    }

    updateTrainingExercises(newTraining, exercises, options);
  }

  const value: ISupersetsContext = {
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
    updateTrainingExerciseParams,
  };

  return (
    <SupersetsContext.Provider value={value}>
      {children}
    </SupersetsContext.Provider>
  );
}
