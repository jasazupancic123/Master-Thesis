import { CommonService } from '@/common/service/common.service';
import { Box, Typography } from '@mui/material';
import { TrainingCardProps } from './props';
import Subgroups from './subgroups';
import TrainingComponentCard from './training-component';

const commonService = CommonService.instance;

export default function TrainingCard(props: TrainingCardProps) {
  const { day, training, period } = props;

  return (
    <Box width="100%">
      <Box display="flex" mt={2}>
        <Box
          display="flex"
          width="wrap"
          alignItems="center"
          justifyContent="flex-start"
          sx={{
            backgroundColor: '#005D57',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}
          p={0}
        >
          <Box
            p={2}
            mr={1}
            sx={{
              backgroundColor: 'background.paper',
              borderTopLeftRadius: 10,
            }}
          />
          <Typography variant="caption" sx={{ mx: 1 }}>
            {period}
          </Typography>

          <Typography variant="caption" sx={{ mx: 1 }}>
            {commonService.date.format(day.date)}
          </Typography>

          <Typography variant="caption" sx={{ mx: 1 }}>
            {commonService.date.formatTime(training.from)}:
            {commonService.date.formatTime(training.to)}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          border: '1px solidrgb(36, 38, 46)',
          borderRadius: 2,
          borderTopLeftRadius: 0,
          backgroundColor: 'background.paper',
          p: 1,
          mt: 0,
        }}
      >
        <Typography variant="h6" p={1}>
          Training ({commonService.date.formatTime(training.from)} -{' '}
          {commonService.date.formatTime(training.to)})
        </Typography>

        <Subgroups />

        {training.components.map((trainingComponent, i) => (
          <TrainingComponentCard
            key={i}
            training={training}
            trainingComponent={trainingComponent}
          />
        ))}
      </Box>
    </Box>
  );
}
