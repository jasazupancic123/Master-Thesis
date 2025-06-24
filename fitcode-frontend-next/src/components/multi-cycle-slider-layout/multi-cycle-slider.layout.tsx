'use client';

import { SetState } from '@/common/type/state.type';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Add, ArrowLeft, ArrowRight } from '@mui/icons-material';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { useEffect, useRef, useState } from 'react';
import { changeYear, handleAddCycle } from './state';
import MultiCycleSlider from '../multi-cycle-slider/multi-cycle-slider';

dayjs.extend(dayOfYear);

interface MultiCycleSliderProps {
  selectedGroup: Group;
  setSelectedGroup: SetState<Group>;
}

export default function MultiCycleSliderLayout(props: MultiCycleSliderProps) {
  const { selectedGroup, setSelectedGroup } = props;

  const screenSize = useScreenSize();
  const { group, setDetectedChanges, setCycle } = useGroup();

  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const yearStart = dayjs(`${selectedYear}-01-01`).dayOfYear();
  const yearEnd = dayjs(`${selectedYear}-12-31`).dayOfYear();

  const [sortedCycles, setSortedCycles] = useState<Cycle[]>([]);
  const [valuesReal, setValuesReal] = useState<number[]>(() =>
    sortedCycles.flatMap((cycle) => {
      let start = dayjs(cycle.from).year(selectedYear).dayOfYear();
      let end = dayjs(cycle.to).year(selectedYear).dayOfYear();

      if (dayjs(cycle.from).year() < selectedYear) start = yearStart;
      if (dayjs(cycle.to).year() > selectedYear) end = yearEnd;

      return start < end ? [start, end] : [end, start];
    })
  );

  const [cycles, setCycles] = useState<Cycle[]>([]);
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

  useEffect(() => {
    if (!sliderRef.current) return;
    const sliderBounds = sliderRef.current.getBoundingClientRect();
  }, [sliderRef.current]); // Runs when the sliderRef is set

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      p={screenSize.isMobile ? 1 : 3}
      width="100%"
      height="100%"
      sx={{
        margin: 'auto 0',
      }}
    >
      {/* Year Navigation */}
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <IconButton onClick={() => changeYear('prev', setSelectedYear)}>
          <ArrowLeft />
        </IconButton>

        <Typography variant="h6">{selectedYear}</Typography>

        <IconButton onClick={() => changeYear('next', setSelectedYear)}>
          <ArrowRight />
        </IconButton>
      </Stack>

      <Box
        flexDirection="row"
        display="flex"
        width="100%"
        alignItems="center"
        justifyContent="flex-start"
      >
        <IconButton
          sx={{
            mb: screenSize.isMobile ? 4.4 : 5.1,
            backgroundColor: 'primary.light',
            color: 'white',
            borderRadius: '50%',
            width: screenSize.isMobile ? 20 : 30,
            height: screenSize.isMobile ? 20 : 30,
            p: screenSize.isMobile ? 1 : 0,
            mr: 1,
            '&:hover': { backgroundColor: 'primary.dark' },
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
                name: `Cycle ${selectedGroup.cycles.length + 1}`,
                description: '',
                from: from.toDate()!,
                to: to.toDate()!,
              },
              {
                selectedGroup,
                setSelectedGroup,
                setCycles,
                setDetectedChanges,
              }
            );
          }}
        >
          <Add />
        </IconButton>

        <Box display="flex" flexDirection="column" width="100%">
          {/* Slider */}
          <MultiCycleSlider
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            valuesReal={valuesReal}
            setValuesReal={setValuesReal}
            cycles={cycles}
            setCycles={setCycles}
            draggingIndex={draggingIndex}
            setDraggingIndex={setDraggingIndex}
            sliderRef={sliderRef}
            selectedYear={selectedYear}
            sortedCycles={sortedCycles}
            yearStart={yearStart}
            yearEnd={yearEnd}
            setSortedCycles={setSortedCycles}
          />

          {/* Month Labels */}
          <Stack
            direction="row"
            justifyContent="space-between"
            width="100%"
            mt={2.5}
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
