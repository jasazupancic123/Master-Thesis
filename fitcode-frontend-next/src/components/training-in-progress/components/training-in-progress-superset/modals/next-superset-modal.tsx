import { SetState } from '@/common/type/state.type';
import MyModal from '@/util/modal/modal';
import { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTraining } from '@/store/training.provider';
import { Typography } from '@mui/material';
import { RefObject } from 'react';
import { ModalProps } from '@/common/type/modal-props.type';

interface NextSupersetModalProps {
  boxRef: RefObject<HTMLDivElement | null>;
}

export default function NextSupersetModal(
  props: NextSupersetModalProps & ModalProps
) {
  const { boxRef, open, setOpen } = props;

  const { trainingInProgress, setTrainingInProgress } = useTraining();

  const { selectedSuperset, setSelectedSuperset } = useTrainingInProgress();

  if (!trainingInProgress || !selectedSuperset) return null;

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      cancelText="Cancel"
      onCancel={() => setOpen(false)}
      onConfirm={() => {
        setSelectedSuperset(
          trainingInProgress.supersets[
            trainingInProgress.supersets.indexOf(selectedSuperset) + 1
          ]
        );
        if (!trainingInProgress.supersetIndex) {
          setTrainingInProgress(
            (prev) =>
              ({
                ...prev,
                supersetIndex: 1,
              }) as TrainingInProgress
          );
        } else {
          setTrainingInProgress((prev: TrainingInProgress | null) => {
            if (!prev) return null;
            return {
              ...prev,
              supersetIndex: prev.supersetIndex + 1,
            } as TrainingInProgress;
          });
        }

        setOpen(false);
        if (boxRef.current) {
          boxRef.current.scrollTop = 0;
        }
      }}
    >
      <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
        Move to next superset?
      </Typography>
    </MyModal>
  );
}
