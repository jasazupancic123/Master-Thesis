import { isBefore } from 'date-fns';
import toast from 'react-hot-toast';

import { core } from '@/core/core.service';
import { PeriodizationType } from '@/core/training/enum/periodization-type.enum';
import type { SetState } from '@/lib/common/type/state.type';
import type { IGroupCtx } from '@/store/group.provider';
import type { TrainerDayViewCtxExtended } from '@/store/trainer-day-view.provider';

export function handleSetPeriodizationType(
  input: {
    periodizationType: string | number;
    setOpenModal: SetState<boolean>;
    setSelectedPeriodizationType: SetState<PeriodizationType | null>;
    setNumTrainingsWithSameTarget: SetState<number>;
  },
  context: {
    useGroup: IGroupCtx;
    useTrainerDayViewContext: TrainerDayViewCtxExtended;
  }
) {
  const {
    periodizationType,
    setOpenModal,
    setSelectedPeriodizationType,
    setNumTrainingsWithSameTarget,
  } = input;
  const { useGroup, useTrainerDayViewContext } = context;

  const { trainings, detectedChanges } = useGroup;

  const {
    training,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedExerciseIds: selectedExercises,
  } = useTrainerDayViewContext;

  if (detectedChanges) {
    toast.error('Save training first', {
      icon: '⚠️',
      duration: 3000,
    });
    return;
  }

  if (!periodizationType) {
    if (!selectedSubgroup) {
      setComponent({
        ...component,
        periodizationType: undefined,
      });
    } else {
      setSelectedSubgroup((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          periodizationType: undefined,
        };
      });
    }
    return;
  }

  if (
    periodizationType !== PeriodizationType.REPLICATE &&
    !selectedExercises.length
  ) {
    toast.error('Select exercises to periodize');
    return;
  }

  let numTrainingsWithSameTarget = 0;
  trainings.forEach((t) => {
    if (training.id === t.id || isBefore(t.from, training.from)) return;
    const sameComponent = t.components.find((c) => c.id === component.id);
    if (!sameComponent) return;

    const componentTarget = core.training.component.findTarget(
      component.targetId
    );

    const sameComponentTarget = core.training.component.findTarget(
      sameComponent.targetId
    );

    if (!componentTarget && !sameComponentTarget) {
      // if no traget is selected, count the ones without a target
      numTrainingsWithSameTarget++;
    } else if (sameComponentTarget?.field === componentTarget?.field)
      numTrainingsWithSameTarget++;
  });

  setSelectedPeriodizationType(periodizationType as PeriodizationType | null);
  setNumTrainingsWithSameTarget(numTrainingsWithSameTarget);
  setOpenModal(true);
}
