'use client';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

import { MAX_WIDTH } from '../trainer-day-view/constant';
import VerticalLinesBorders from '../vertical-lines-borders/vertical-lines-borders';
import MultiCycleSliderLayout from '@/components/multi-cycle-slider-layout/multi-cycle-slider.layout';
import CycleComponents from '@/components/training-year-cycle-components/training-year-cycle-components';
import type { Cycle } from '@/controller/group/type/cycle.type';
import { useGroup } from '@/store/group.provider';

export default function TrainerYearView() {
  const { group, selectedGroup, setSelectedGroup } = useGroup();

  const theme = useTheme();

  const [sortedCycles, setSortedCycles] = useState<Cycle[]>([]);
  const [sliderProperties, setSliderProperties] = useState<
    { width: string; centerPosition: string }[]
  >([]);

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
          <MultiCycleSliderLayout
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            sortedCycles={sortedCycles}
            setSortedCycles={setSortedCycles}
            sliderProperties={sliderProperties}
            setSliderProperties={setSliderProperties}
          />
        </Box>

        <Box width="100%" maxWidth="100%">
          <CycleComponents
            sortedCycles={sortedCycles}
            setSortedCycles={setSortedCycles}
            sliderProperties={sliderProperties}
          />
        </Box>
      </Box>
    </Box>
  );
}
