import { formatTime } from '@/common/service/util/date.util';
import { Dayjs } from 'dayjs';
import Box from '@mui/material/Box';
import { AddSetGroup, Training } from '@/training/type/training.type';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Divider } from '@mui/material';
import { useAppContext } from '@/context/app-provider';
import { RemoveCircle } from '@mui/icons-material';
import { FirebaseFirestoreUtil } from '@/common/service/util/firebase-firestore.util';
import { AppContextType } from '@/common/type/context.type';

type TrainingBoxProps = {
  training: Training
  selectedComponents: string[]
  addSetGroup: (data: AddSetGroup) => void
  deleteTraining: (training: Training) => Promise<void>
}

export default function TrainingGridItem(props: TrainingBoxProps) {
  const { training, selectedComponents, addSetGroup, deleteTraining } = props;
  const { components } = useAppContext() as AppContextType;

  // populate training with components
  const populated = FirebaseFirestoreUtil.populateTraining(training, components.flat);
  const setGroups = populated.setGroups || [];

  return <Box position="relative" width={100}>
    <Box position="absolute" top={-16} left={-8} display="flex" alignItems="center" justifyContent="space-between"
         width="120%">
      {/* Training date */}
      <Typography variant="caption" bgcolor="secondary.main" color="black" p={0.5} fontSize={11}>
        {formatTime(training.startTime as Dayjs)} - {formatTime(training.endTime as Dayjs)}
      </Typography>

      <IconButton size="small" onClick={async () => await deleteTraining(training)}>
        <RemoveCircle color="error" />
      </IconButton>
    </Box>

    <Box mt={1} pt={3} px={1} borderRadius={1} boxShadow={1} bgcolor="background.paper" height={200}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        {selectedComponents?.length ? <IconButton size="small" onClick={() => addSetGroup({
          trainingId: training.id,
          componentIds: selectedComponents,
        })}>
          <AddIcon />
        </IconButton> : null}
      </Stack>

      <Divider />

      <Stack direction="column" alignItems="left" spacing={1} my={1}>
        {setGroups.map(({ component }, index) => {
          return <Typography key={index} variant="caption">{component?.name}</Typography>;
        })}
      </Stack>
    </Box>
  </Box>;
}