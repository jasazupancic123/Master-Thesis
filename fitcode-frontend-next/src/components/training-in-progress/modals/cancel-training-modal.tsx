import MyModal from '@/util/modal/modal';
import useTrainingInProgressUtils from '../hooks/use-utils';
import { Typography } from '@mui/material';

export default function CancelTrainingModal() {
  const {
    openCancelTrainingModal,
    setOpenCancelTrainingModal,
    handleCancelTraining,
  } = useTrainingInProgressUtils();

  return (
    <MyModal
      isOpen={openCancelTrainingModal}
      setIsOpen={(open) => setOpenCancelTrainingModal(open)}
      cancelText="Cancel"
      onCancel={() => setOpenCancelTrainingModal(false)}
      onConfirm={() => {
        handleCancelTraining();
        setOpenCancelTrainingModal(false);
      }}
    >
      <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
        Cancel Training?
      </Typography>
    </MyModal>
  );
}
