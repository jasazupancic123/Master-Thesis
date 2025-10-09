import { SetState } from '@/common/type/state.type';
import MyModal from '@/components/modal/modal';
import useTrainingInProgressUtils from '@/components/training-in-progress/hooks/use-utils';
import { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTraining } from '@/store/training.provider';
import { Typography } from '@mui/material';
import { RefObject } from 'react';

interface NextSupersetModalProps {
  boxRef: RefObject<HTMLDivElement | null>;
  openNextSupersetModal: boolean;
  setOpenNextSupersetModal: SetState<boolean>;
}

export default function NextSupersetModal(props: NextSupersetModalProps) {
  const { boxRef, openNextSupersetModal, setOpenNextSupersetModal } = props;

  const { trainingInProgress, setTrainingInProgress } = useTraining();

  const { selectedSuperset, setSelectedSuperset } = useTrainingInProgress();

  if (!trainingInProgress || !selectedSuperset) return null;

  return (
    <MyModal
      isOpen={openNextSupersetModal}
      setIsOpen={(open) => setOpenNextSupersetModal(open)}
      cancelText="Cancel"
      onCancel={() => setOpenNextSupersetModal(false)}
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
        setOpenNextSupersetModal(false);
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
