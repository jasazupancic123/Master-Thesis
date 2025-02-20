'use client';

import { Box, IconButton, Tooltip } from '@mui/material';
import TrainerGroupPage from './trainer-group-page';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import { useScreenSize } from '@/context/screen-size-provider';
import { useGroup } from '@/context/group-provider';
import { handleApiRequest } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
export default function TrainerGroupPageContainer() {
  const router = useRouter();
  const { token, components, setTrainings, setFilteredTrainings } = useGroup();

  async function handleUpdateTraining() {
    if (!training) return;

    await handleApiRequest(
      router,
      () => TrainingController.update(token, training.id, training),
      (newTraining) => {
        const mapped = TrainingService.mapComponents(newTraining, components);

        setTrainings((prev) =>
          prev.map((t) => (t.id === newTraining.id ? mapped : t))
        );

        setFilteredTrainings((prev) =>
          prev.map((t) => (t.id === newTraining.id ? mapped : t))
        );

        toast.success('Training updated successfully');
      },
      undefined,
      'Error when updating training'
    );
  }

  const screenSize = useScreenSize();
  const { training } = useGroup();
  return screenSize.isSmallerThanLaptop ? (
    <TrainerGroupPage />
  ) : (
    <Box
      display="flex"
      width="100%"
      alignItems="center"
      justifyContent="center"
      sx={{pl: 6}}
    >
      <TrainerGroupPage />
      <Tooltip title="Save training">
        <IconButton
          onClick={() => {
            handleUpdateTraining();
          }}
          sx={{ pr: 1, ml: 2 }}
        >
          <SaveAsIcon sx={{ mr: 0, cursor: 'pointer' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
