import { Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { stateUpdate } from './actions/actions-training-component';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import type { SetState } from '@/lib/common/type/state.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import type { PeriodizationType } from '@/core/training/enum/periodization-type.enum';
import { TrainingController } from '@/core/training/training.controller';
import { TrainingService } from '@/core/training/training.service';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import MyModal from '@/util/modal/modal';

export default function PeriodizeModal(
  props: ModalProps & {
    selectedPeriodizationType: PeriodizationType | null;
    setSelectedPeriodizationType: SetState<PeriodizationType | null>;
    numTrainingsWithSameTarget: number;
    setNumTrainingsWithSameTarget: SetState<number>;
  }
) {
  const router = useRouter();

  const mainContext = useMain();
  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayView();

  const {
    components: allComponents,
    exercises: allExercises,
    methods: allMethods,
  } = mainContext;

  const { setTrainings } = groupContext;

  const {
    training,
    setTraining,
    component,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedExerciseIds,
  } = trainerDayViewContext;

  const {
    open,
    setOpen,
    selectedPeriodizationType,
    setSelectedPeriodizationType,
    numTrainingsWithSameTarget,
    setNumTrainingsWithSameTarget,
  } = props;

  const controller = TrainingController.getInstance();

  if (!training || !component) return null;

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      onCancel={() => {
        setNumTrainingsWithSameTarget(0);
        setSelectedPeriodizationType(null);
        setOpen(false);
      }}
      onConfirm={() => {
        if (!training) return;

        handleApiRequest(
          router,
          () =>
            controller.periodize(training.id, component.id, {
              periodizationType: selectedPeriodizationType as PeriodizationType,
              exerciseIds: selectedExerciseIds,
              subgroupId: selectedSubgroup?.id,
            }),
          (periodizedTrainings) => {
            periodizedTrainings.map((pt) => {
              TrainingService.mapData(pt, {
                components: allComponents,
                exercises: allExercises,
                methods: allMethods,
              });

              return pt;
            });

            const currentTraining = periodizedTrainings.find(
              (t) => t.id === training.id
            );
            if (currentTraining) setTraining(currentTraining);

            setTrainings((prev) =>
              prev.map((t) => {
                const newTraining = periodizedTrainings.find(
                  (nt) => nt.id === t.id
                );

                return newTraining ? newTraining : t;
              })
            );

            if (selectedSubgroup) {
              setSelectedSubgroup((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  periodizationType: selectedPeriodizationType
                    ? (selectedPeriodizationType as PeriodizationType)
                    : undefined,
                };
              });

              const updatedComponent: TrainingComponent = {
                ...component,
                subgroups: (component.subgroups || []).map((sg) => {
                  if (sg.id === selectedSubgroup?.id) {
                    return {
                      ...sg,
                      periodizationType: selectedPeriodizationType
                        ? (selectedPeriodizationType as PeriodizationType)
                        : undefined,
                    };
                  }
                  return sg;
                }),
              };

              stateUpdate(
                { updatedComponent },
                { useTrainerDayViewContext: trainerDayViewContext }
              );
            } else {
              const updatedComponent = {
                ...component,
                periodizationType: selectedPeriodizationType
                  ? (selectedPeriodizationType as PeriodizationType)
                  : undefined,
              };

              stateUpdate(
                { updatedComponent },
                { useTrainerDayViewContext: trainerDayViewContext }
              );
            }

            setNumTrainingsWithSameTarget(0);
            setSelectedPeriodizationType(null);
            setOpen(false);

            toast.success(
              `${selectedSubgroup ? 'Subgroups' : 'Trainings'} periodized successfully`
            );
          },
          undefined,
          'Failed to periodize trainings'
        );
      }}
      cancelText="Close"
    >
      {selectedSubgroup && (
        <Typography variant="body1" textAlign="center" mb={1}>
          {`Periodizing subgroup ${selectedSubgroup.name}`}
        </Typography>
      )}
      <Typography variant="body1" textAlign="center">
        Periodize {numTrainingsWithSameTarget} other trainings with type{' '}
        {selectedPeriodizationType}?
      </Typography>
    </MyModal>
  );
}
