import MyModal from '@/util/modal/modal';
import { Typography } from '@mui/material';
import { useTrainingInProgressUtils } from '../context/training-in.progress-utils.provider';
import { ModalProps } from '@/common/type/modal-props.type';

export default function CancelTrainingModal(props: ModalProps) {
  const { open, setOpen } = props;

  const { handleCancelTraining } = useTrainingInProgressUtils();

  return (
    <MyModal
      isOpen={open}
      setIsOpen={setOpen}
      cancelText="Cancel"
      onCancel={() => setOpen(false)}
      onConfirm={() => {
        handleCancelTraining();
        setOpen(false);
      }}
    >
      <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
        Cancel Training?
      </Typography>
    </MyModal>
  );
}
