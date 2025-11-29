import { Components } from '@/core/exercise/constant/components.constant';
import { TrainingComponent } from '@/core/training/type/training-component.type';
import { Training } from '@/core/training/type/training.type';
import { ModalProps } from '@/lib/common/type/modal-props.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useTrainings } from '@/store/trainings.provider';
import MyModal from '@/ui/modal';
import { Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { startTrainingComponent } from '../actions/actions-training-component';

interface Props extends ModalProps {
  training: Training;
  selectedComponent: TrainingComponent | null;
}

export default function StartTrainingComponentModal(props: Props) {
  const router = useRouter();

  const { training, selectedComponent, open, setOpen } = props;

  const mainContext = useMain();
  const trainingsContext = useTrainings();

  const { user } = useAuthenticatedAuth();

  const hasPlayedAudioRef = useRef(false);

  if (!selectedComponent) return null;

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      cancelText="Cancel"
      onCancel={() => setOpen(false)}
      onConfirm={async () => {
        await startTrainingComponent(
          {
            useMain: mainContext,
            useTrainings: trainingsContext,
          },
          {
            user,
            training,
            selectedComponent,
            setOpen,
            hasPlayedAudioRef,
            router,
          }
        );
      }}
    >
      <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
        Start{' '}
        <b>
          {Components.find((c) => c.field === selectedComponent?.id)?.name ||
            'training'}
        </b>
        ?
      </Typography>
    </MyModal>
  );
}
