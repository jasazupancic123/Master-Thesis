import { Typography } from '@mui/material';

import { INDEX_DB_TRAINING_STATIONS_ID } from '../const/index-db-stations-id';
import { lib } from '@/lib';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { useCoachTraining } from '@/store/coach-training.provider';
import { useCoachTrainingStation } from '@/store/training-station.provider';
import MyModal from '@/ui/modal';

export default function NewStationModal(props: ModalProps) {
  const { open, setOpen } = props;

  const { training } = useCoachTraining();
  const { component, setStation } = useCoachTrainingStation();

  if (!component) return null;

  return (
    <MyModal
      isOpen={open}
      setIsOpen={setOpen}
      onCancel={() => setOpen(false)}
      cancelText="Cancel"
      onConfirm={async () => {
        await lib.common.indexedDb.items.delete(
          `${INDEX_DB_TRAINING_STATIONS_ID}-${training.id}-${component.id}`
        );

        setStation(null);
        setOpen(false);
      }}
    >
      <Typography>Delete current station and setup a new one?</Typography>
    </MyModal>
  );
}
