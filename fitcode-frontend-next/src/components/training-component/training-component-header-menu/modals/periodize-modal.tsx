import MyModal from '@/components/modal/modal';
import useComponentHeaderUtils from '../hooks/use-utils';
import { handleApiRequest } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import { PeriodizationType } from '@/controller/training/enum/periodization-type.enum';
import { useRouter } from 'next/navigation';
import { TrainingService } from '@/controller/training/training.service';
import { useMain } from '@/store/main.provider';
import { useGroup } from '@/store/group.provider';
import { TrainingComponent } from '@/controller/training/type/training-component.type';
import { stateUpdate } from '../actions/actions-training-component';
import toast from 'react-hot-toast';
import { Typography } from '@mui/material';

export default function PeriodizeModal() {
  const router = useRouter();

  const {
    components: allComponents,
    exercises: allExercises,
    methods: allMethods,
  } = useMain();

  const { setTrainings } = useGroup();

  const {
    training,
    setTraining,
    component,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedExercises,
  } = useTrainerDayViewContext();

  const {
    selectedPeriodizationType,
    setSelectedPeriodizationType,
    numTrainingsWithSameTarget,
    setNumTrainingsWithSameTarget,
    openModal,
    setOpenModal,
  } = useComponentHeaderUtils();

  const controller = TrainingController.getInstance();

  if (!training || !component) return null;

  return (
    <MyModal
      isOpen={openModal}
      setIsOpen={(open) => setOpenModal(open)}
      onCancel={() => {
        setNumTrainingsWithSameTarget(0);
        setSelectedPeriodizationType(null);
        setOpenModal(false);
      }}
      onConfirm={() => {
        if (!training) return;

        handleApiRequest(
          router,
          () =>
            controller.periodize(training.id, component.id, {
              periodizationType: selectedPeriodizationType as PeriodizationType,
              exerciseIds: selectedExercises.map((e) => e.id),
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
                { useTrainerDayViewContext: useTrainerDayViewContext() }
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
                { useTrainerDayViewContext: useTrainerDayViewContext() }
              );
            }

            setNumTrainingsWithSameTarget(0);
            setSelectedPeriodizationType(null);
            setOpenModal(false);

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
