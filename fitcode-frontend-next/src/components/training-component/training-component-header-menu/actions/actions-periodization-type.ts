import { PeriodizationType } from '@/controller/training/enum/periodization-type.enum';
import { GroupProviderReturnType } from '@/store/group.provider';
import { TrainerDayViewProviderReturnTypeDefined } from '@/store/trainer-day-view.provider';
import { isBefore } from 'date-fns';
import toast from 'react-hot-toast';
import { UseComponentHeaderUtilsReturnType } from '../hooks/use-utils';

export function handleSetPeriodizationType(
  input: { periodizationType: PeriodizationType },
  context: {
    useGroup: GroupProviderReturnType;
    useTrainerDayViewContext: TrainerDayViewProviderReturnTypeDefined;
    useComponentHeaderUtils: UseComponentHeaderUtilsReturnType;
  }
) {
  const { periodizationType } = input;
  const { useGroup, useTrainerDayViewContext, useComponentHeaderUtils } =
    context;

  const { trainings, detectedChanges } = useGroup;

  const {
    setSelectedPeriodizationType,
    setNumTrainingsWithSameTarget,
    setOpenModal,
  } = useComponentHeaderUtils;

  const {
    training,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedExercises,
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

  if (!training) return;

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

    const sameComponent = t.components.find(
      (c) =>
        c.id === component.id || c.component?.id === component.component?.id
    );
    if (!sameComponent) return;

    if (!component.target && !sameComponent.target) {
      // if no traget is selected, count the ones without a target
      numTrainingsWithSameTarget++;
    } else if (sameComponent.target?.id === component.target?.id)
      numTrainingsWithSameTarget++;
  });

  setSelectedPeriodizationType(periodizationType as PeriodizationType | null);
  setNumTrainingsWithSameTarget(numTrainingsWithSameTarget);
  setOpenModal(true);
}
