'use client';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { MAX_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import VerticalLinesBorders from '../../util/vertical-lines-borders/vertical-lines-borders';
import MultiCycleSliderLayout from '@/components/trainer-group-year-view/components/multi-cycle-slider/components/multi-cycle-slider-layout/multi-cycle-slider.layout';
import CycleComponents from '@/components/trainer-group-year-view/components/training-year-cycle-components/training-year-cycle-components';
import useMultiCycleSliderProperties from './components/multi-cycle-slider/hooks/use-slider-properties';

export default function TrainerYearView() {
  const theme = useTheme();

  const useSliderProperties = useMultiCycleSliderProperties();

  return (
    <Box
      position="relative"
      sx={{
        backgroundColor: theme.palette.background.default,
        width: '100%',
        maxWidth: MAX_WIDTH,
        minHeight: 'calc(100vh - 50px)',
        overflowY: 'none',
        mx: 'auto',
      }}
    >
      <VerticalLinesBorders />

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        width="100%"
        maxWidth="100%"
        pb={10}
        sx={{ overflowX: 'hidden', px: 2 }}
      >
        <Box
          width="100%"
          maxWidth="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <MultiCycleSliderLayout useSliderProperties={useSliderProperties} />
        </Box>

        <Box width="100%" maxWidth="100%">
          <CycleComponents useSliderProperties={useSliderProperties} />
        </Box>
      </Box>
    </Box>
  );
}
