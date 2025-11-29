import { Typography } from '@mui/material';

import { handleFinishSuperset } from '../actions/actions-superset';
import { useTrainingInProgressUtils } from '../context/training-in.progress-utils.provider';
import { useUndoneExercises } from '../context/undone-exercises.provider';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { useMain } from '@/store/main.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';
import MyModal from '@/ui/modal';

export default function FinishPauseTrainingModal(
  props: ModalProps & { finish: boolean }
) {
  const { open, setOpen, finish } = props;

  const mainContext = useMain();
  const trainingInProgressUtilsContext = useTrainingInProgressUtils();

  const trainingContext = useTrainings();
  const trainingInProgressUndoneExercisesContext = useUndoneExercises();
  const trainingInProgressContext = useTrainingInProgress();

  const { trainingInProgress } = trainingContext;

  const { handlePauseTraining: handleCancelTraining } =
    trainingInProgressUtilsContext;

  return (
    <MyModal
      isOpen={open}
      setIsOpen={setOpen}
      cancelText="Cancel"
      onCancel={() => setOpen(false)}
      onConfirm={async () => {
        if (!trainingInProgress) return;

        if (finish) {
          // finish
          await handleFinishSuperset({
            useMain: mainContext,
            useTraining: {
              ...trainingContext,
              trainingInProgress,
            },
            useUndoneExercises: trainingInProgressUndoneExercisesContext,
            useTrainingInProgress: trainingInProgressContext,
            useTrainingInProgressUtils: trainingInProgressUtilsContext,
          });
        } else {
          // pause
          await handleCancelTraining();
        }
        setOpen(false);
      }}
    >
      <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
        {finish ? 'Finish Training?' : 'Pause Training?'}
      </Typography>
    </MyModal>
  );
}
