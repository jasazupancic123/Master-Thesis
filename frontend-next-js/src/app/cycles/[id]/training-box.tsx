import { formatTime } from '@/util/date';
import { Dayjs } from 'dayjs';
import Box from '@mui/material/Box';
import { AddSetGroup, Training } from '@/type/training.type';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Divider } from '@mui/material';

type TrainingBoxProps = {
  training: Training
  selectedComponents: string[]
  addSetGroup: (data: AddSetGroup) => void
}

export default function TrainingBox(props: TrainingBoxProps) {
  const { training, selectedComponents, addSetGroup } = props

  return <Box position='relative' width={100}>
    <Box position='absolute' top={-16}>
      {/* Training date */}
      <Typography variant="caption" bgcolor='secondary.main' color='black' p={0.5}>
        {formatTime(training.startTime as Dayjs)} - {formatTime(training.endTime as Dayjs)}
      </Typography>

      {/* Delete icon if current user is owner of the exercise */}
      {/*<IconButton size='small'>
        <DeleteIcon color='error' />
      </IconButton>*/}
    </Box>

    <Box mt={1} pt={1} px={1} borderRadius={1} boxShadow={1} bgcolor='background.paper' height={200}>
      <Stack direction='row' justifyContent='space-between' alignItems='center'>
        {selectedComponents?.length ? <IconButton size='small' onClick={() => addSetGroup({
          trainingId: training.id,
          componentIds: selectedComponents,
        })}>
          <AddIcon />
        </IconButton> : null}
      </Stack>

      <Divider />

      <Stack direction='column' alignItems='left' spacing={1} my={1}>
        {(training.components || []).map((component, index) => {
          return <Typography key={index} variant='caption'>{component.name}</Typography>
        })}
      </Stack>
    </Box>
  </Box>
}