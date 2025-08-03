'use client';

import Save from '@mui/icons-material/Save';
import { IconButton, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { MAX_WIDTH } from '../trainer-day-view/constant';
import VerticalLinesBorder from '../vertical-lines-border/vertical-lines-border';
import { handleSaveGroup } from '@/app/(trainer)/groups/[group_id]/state';
import MultiCycleSliderLayout from '@/components/multi-cycle-slider-layout/multi-cycle-slider.layout';
import CycleComponents from '@/components/training-year-cycle-components/training-year-cycle-components';
import type { Cycle } from '@/controller/group/type/cycle.type';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';

export default function TrainerYearView() {
  const screenSize = useScreenSize();
  const router = useRouter();
  const { group, setGroup, cycle, setCycle, setDetectedChanges } = useGroup();

  const theme = useTheme();
  const [selectedGroup, setSelectedGroup] = useState({ ...group });

  const [sortedCycles, setSortedCycles] = useState<Cycle[]>([]);
  const [sliderProperties, setSliderProperties] = useState<
    { width: string; centerPosition: string }[]
  >([]);

  return (
    <>
      {!screenSize.isSmallerThanLaptop && (
        <Box
          justifyContent="flex-end"
          alignItems="center"
          sx={{
            position: 'absolute',
            right: screenSize.isSmallerThanLaptop ? 2 : 10,
            top: 11,
            zIndex: 1300,
          }}
        >
          <Tooltip title="Save group" placement="bottom" sx={{ mx: 1 }}>
            <IconButton
              sx={{ p: 0, m: 0, mx: 1, cursor: 'pointer' }}
              onClick={() =>
                handleSaveGroup(
                  selectedGroup,
                  setSelectedGroup,
                  cycle,
                  setCycle,
                  setDetectedChanges,
                  router,
                  setGroup
                )
              }
            >
              <Save fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
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
        <VerticalLinesBorder />

        {screenSize.isSmallerThanLaptop && (
          <IconButton
            onClick={() =>
              handleSaveGroup(
                selectedGroup,
                setSelectedGroup,
                cycle,
                setCycle,
                setDetectedChanges,
                router,
                setGroup
              )
            }
            sx={{ p: 0, ml: 2, position: 'fixed', bottom: 30, right: 30 }}
          >
            <Save
              sx={{
                mr: 0,
                cursor: 'pointer',
                backgroundColor: theme.palette.primary.main,
                borderRadius: '50%',
                p: 1,
                fontSize: 40,
              }}
            />
          </IconButton>
        )}

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          width="100%"
          maxWidth="100%"
          pb={10}
          sx={{ overflowX: 'hidden' }}
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
    </>
  );
}
