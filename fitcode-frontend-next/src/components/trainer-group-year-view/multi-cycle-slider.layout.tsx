'use client';

import { Add } from '@mui/icons-material';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

import { handleAddCycle } from './actions/actions-cycle';
import type { UseSliderPropertiesReturnType } from './hooks/use-slider-properties';
import MultiCycleSlider from './multi-cycle-slider';
import { useMultiCycleSliderCyclesProvider } from '@/components/trainer-group-year-view/context/cycles.provider';
import { useMultiCycleSliderYearProvider } from '@/components/trainer-group-year-view/context/years.provider';
import MobileDoubleTextItems from '@/components/trainer-group-year-view/mobile-double-text-items';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import HorizontalItemsList from '@/ui/horizontal-items-list';

dayjs.extend(dayOfYear);

interface MultiCycleSliderLayoutProps {
  useSliderProperties: UseSliderPropertiesReturnType;
}

export default function MultiCycleSliderLayout(
  props: MultiCycleSliderLayoutProps
) {
  const theme = useTheme();
  const router = useRouter();
  const screenSize = useScreenSize();

  const mainContext = useMain();
  const groupContext = useGroup();

  const { selectedGroup, group } = groupContext;

  const sliderCyclesContext = useMultiCycleSliderCyclesProvider();

  const { activeCycle } = sliderCyclesContext;

  const { useSliderProperties } = props;

  const { yearsForSelect, selectedYear, setSelectedYear } =
    useMultiCycleSliderYearProvider();

  const sliderRef = useRef<HTMLDivElement | null>(null);

  const HorizontalItems = () => {
    return (
      <HorizontalItemsList
        items={yearsForSelect}
        value={selectedYear.toString()}
        setValue={(value) => {
          setSelectedYear(parseInt(value, 10));
        }}
        onArrowClick={() => {}}
        cycleView
        yearView
        checkIsSameValue={(value: string) => {
          return dayjs(value).year() === selectedYear;
        }}
      />
    );
  };

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        px: 0,
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Box width="100%" display="flex">
        {screenSize.isSmallerThanLaptop ? (
          <Box width="100%" display="flex" flexDirection="column">
            <HorizontalItems />

            <MobileDoubleTextItems
              item1={{
                label: 'Active cycle',
                value: activeCycle ? activeCycle.name : 'No active cycle',
              }}
              item2={{
                label: 'Group',
                value: group.name,
              }}
            />
          </Box>
        ) : (
          <>
            <Box width="25%" mt={0.75}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '12px',
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  Active cycle
                </Typography>
                <Typography
                  textTransform="uppercase"
                  sx={{
                    fontSize: '16px',
                    fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  {activeCycle ? activeCycle.name : 'No active cycle'}
                </Typography>
              </Box>
            </Box>
            <Box width="50%">
              <HorizontalItems />
            </Box>
            <Box width="25%" mt={0.75}>
              <Box display="flex" flexDirection="column" alignItems="flex-end">
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '12px',
                    fontWeight: 400,
                    textAlign: 'right',
                  }}
                >
                  Group
                </Typography>
                <Typography
                  textTransform="uppercase"
                  sx={{
                    fontSize: '16px',
                    fontWeight: 600,
                    textAlign: 'right',
                  }}
                >
                  {group.name}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Box>

      <Box
        flexDirection="row"
        display="flex"
        width="100%"
        alignItems="center"
        justifyContent="space-evenly"
        sx={{
          px: screenSize.isMobile ? 2 : 8,
          py: screenSize.isSmallerThanLaptop ? 1 : 0,
        }}
      >
        <IconButton
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.text.primary,
            borderRadius: '50%',
            p: 0.3,
            mr: 1,
            mt: screenSize.isSmallerThanLaptop ? 0 : -0.4,
            '&:hover': { backgroundColor: 'primary.main' },
          }}
          onClick={() => {
            if (!selectedGroup) return;
            //find the last date

            const lastCycle = selectedGroup.cycles.length
              ? selectedGroup.cycles.reduce((prev, current) =>
                  dayjs(prev.to).isAfter(dayjs(current.to)) ? prev : current
                )
              : undefined;

            const from =
              selectedGroup.cycles.length === 0 || !lastCycle
                ? dayjs().startOf('w').add(1, 'day')
                : dayjs(lastCycle.to).add(1, 'd').startOf('w').add(1, 'day');

            const to =
              selectedGroup.cycles.length === 0 || !lastCycle
                ? dayjs().add(1, 'w').endOf('w').add(1, 'day')
                : dayjs(lastCycle.to).add(1, 'w').endOf('w').add(1, 'day');

            handleAddCycle(
              {
                router,
                addCycleInput: {
                  name: `Cycle ${selectedGroup.cycles.length + 1}`,
                  description: '',
                  from: from.toDate()!,
                  to: to.toDate()!,
                },
              },
              {
                useGroup: groupContext,
                useSliderCycles: sliderCyclesContext,
              }
            );
          }}
        >
          <Add
            fontSize="small"
            sx={{
              color: theme.palette.background.default,
            }}
          />
        </IconButton>

        <Box
          display="flex"
          flexDirection="column"
          width="100%"
          sx={{
            mt: screenSize.isMobile
              ? 2
              : screenSize.isSmallerThanLaptop
                ? 2.5
                : 2,
          }}
        >
          {/* Slider */}
          <MultiCycleSlider
            sliderRef={sliderRef}
            useSliderProperties={useSliderProperties}
          />

          {/* Month Labels */}
          <Stack
            direction="row"
            justifyContent="space-between"
            width="100%"
            mt={0}
          >
            {Array.from({ length: 13 }).map((_, monthIndex) => (
              <Typography
                key={monthIndex}
                variant="caption"
                sx={{ fontSize: screenSize.isMobile ? 9 : undefined }}
              >
                {dayjs().month(monthIndex).format('MMM')}
              </Typography>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
