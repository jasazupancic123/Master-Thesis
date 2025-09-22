'use client';

import { Add } from '@mui/icons-material';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import HorizontalItemsList from '../horizontal-items-list/horizontal-items-list';
import MobileDoubleTextItems from '../mobile-double-text-items/mobile-double-text-items';
import MultiCycleSlider from '../multi-cycle-slider/multi-cycle-slider';
import { handleAddCycle } from './state';
import type { SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Group } from '@/controller/group/type/group.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';

dayjs.extend(dayOfYear);

interface MultiCycleSliderProps {
  selectedGroup: Group;
  setSelectedGroup: SetState<Group>;
  sliderProperties: { width: string; centerPosition: string }[];
  setSliderProperties: SetState<{ width: string; centerPosition: string }[]>;
  sortedCycles: Cycle[];
  setSortedCycles: SetState<Cycle[]>;
}

export default function MultiCycleSliderLayout(props: MultiCycleSliderProps) {
  const {
    selectedGroup,
    setSelectedGroup,
    sliderProperties,
    setSliderProperties,
    sortedCycles,
    setSortedCycles,
  } = props;

  const router = useRouter();
  const screenSize = useScreenSize();
  const theme = useTheme();

  const auth = useAuthenticatedAuth();
  const controller = GroupController.getInstance(auth.token);
  const { group, setGroup, setCycle } = useGroup();

  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [yearsForSelect] = useState<
    { label: string; sublabel: string; value: string }[]
  >(() => {
    const currentYear = dayjs().year();
    const yearsBefore = Array.from(
      { length: 2 },
      (_, i) => currentYear - 1 - i
    );
    const yearsAfter = Array.from({ length: 3 }, (_, i) => currentYear + i);
    return [...yearsBefore.toReversed(), ...yearsAfter].map((year) => ({
      label: 'Year',
      sublabel: year.toString(),
      value: year.toString(),
    }));
  });

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const yearStart = dayjs(`${selectedYear}-01-01`).dayOfYear();
  const yearEnd = dayjs(`${selectedYear}-12-31`).dayOfYear();

  const [valuesReal, setValuesReal] = useState<number[]>(() =>
    sortedCycles.flatMap((cycle) => {
      let start = dayjs(cycle.from).year(selectedYear).dayOfYear();
      let end = dayjs(cycle.to).year(selectedYear).dayOfYear();

      if (dayjs(cycle.from).year() < selectedYear) start = yearStart;
      if (dayjs(cycle.to).year() > selectedYear) end = yearEnd;

      return start < end ? [start, end] : [end, start];
    })
  );

  useEffect(() => {
    const newSliderProperties = sortedCycles.map((cycle, index) => {
      const start = valuesReal[index * 2];
      const end = valuesReal[index * 2 + 1];

      const centerPosition = `${
        (((start + end) / 2 - yearStart) / (yearEnd - yearStart)) * 100
      }%`;

      const width = `${((end - start) / (yearEnd - yearStart)) * 100}%`;
      return { width, centerPosition };
    });

    setSliderProperties(newSliderProperties);
  }, [sortedCycles, valuesReal]);

  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [activeCycle, setActiveCycle] = useState<Cycle | undefined>(undefined);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const newFilteredCycles = cycles.filter(
      (cycle) =>
        dayjs(cycle.from).year() === selectedYear ||
        dayjs(cycle.to).year() === selectedYear
    );

    const newSortedCycles = [...newFilteredCycles].sort(
      (a, b) => dayjs(a.from).dayOfYear() - dayjs(b.from).dayOfYear()
    );

    setSortedCycles(newSortedCycles);
    setValuesReal(() =>
      newSortedCycles.flatMap((cycle) => {
        let start = dayjs(cycle.from).year(selectedYear).dayOfYear();
        let end = dayjs(cycle.to).year(selectedYear).dayOfYear();

        if (dayjs(cycle.from).year() < selectedYear) start = yearStart;
        if (dayjs(cycle.to).year() > selectedYear) end = yearEnd;

        return start < end ? [start, end] : [end, start];
      })
    );
  }, [cycles, selectedYear]);

  useEffect(() => {
    if (!selectedGroup) return;
    setCycles([...selectedGroup.cycles]);
  }, [selectedGroup]);

  useEffect(() => {
    const currentCycle = cycles.find(
      (cycle) =>
        dayjs(cycle.from).isBefore(dayjs()) && dayjs(cycle.to).isAfter(dayjs())
    );

    setActiveCycle(currentCycle);
  }, [cycles]);

  useEffect(() => {
    const selectedGroup_ = {
      ...group,
      cycles: [...group.cycles].map((cycle) => {
        return {
          ...cycle,
        };
      }),
    };
    setCycles([...selectedGroup_.cycles]);
    setSelectedGroup(selectedGroup_);
  }, [group]);

  useEffect(() => {
    if (draggingIndex !== null) return; // prevent overriding dragged values

    setValuesReal((prev) => {
      if (prev.length === sortedCycles.length * 2) return prev;

      return sortedCycles.flatMap((cycle) => {
        let start = dayjs(cycle.from).dayOfYear();
        let end = dayjs(cycle.to).dayOfYear();

        if (dayjs(cycle.from).year() < selectedYear) start = yearStart;
        if (dayjs(cycle.to).year() > selectedYear) end = yearEnd;

        return [start, end];
      });
    });
  }, [selectedYear, sortedCycles]);

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
              controller,
              router,
              {
                name: `Cycle ${selectedGroup.cycles.length + 1}`,
                description: '',
                from: from.toDate()!,
                to: to.toDate()!,
              },
              {
                selectedGroup,
                setSelectedGroup,
                setGroup,
                setSortedCycles,
                setCycles,
                setCycle,
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
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            valuesReal={valuesReal}
            setValuesReal={setValuesReal}
            draggingIndex={draggingIndex}
            setDraggingIndex={setDraggingIndex}
            sliderRef={sliderRef}
            selectedYear={selectedYear}
            sortedCycles={sortedCycles}
            yearStart={yearStart}
            yearEnd={yearEnd}
            sliderProperties={sliderProperties}
            setSortedCycles={setSortedCycles}
            setCycles={setCycles}
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
