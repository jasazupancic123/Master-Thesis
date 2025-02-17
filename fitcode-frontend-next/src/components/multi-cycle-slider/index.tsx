'use client';

import { COLORS } from '@/common/constant/color.constant';
import { useGroup } from '@/context/group-provider';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Add, ArrowLeft, ArrowRight } from '@mui/icons-material';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Range } from 'react-range';
import { MultiCycleSliderProps } from './props';
import {
  changeYear,
  handleDrag,
  handleDragChange,
  handleUpdateCycleDates,
} from './state';

dayjs.extend(dayOfYear);

export default function MultiCycleSlider(props: MultiCycleSliderProps) {
  const { setShowModal } = props;

  const { token, group, setGroup, cycle, setCycle } = useGroup();
  const theme = useTheme();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [draggedDay, setDraggedDay] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [detectedChange, setDetectedChange] = useState<boolean>(false);

  const yearStart = dayjs(`${selectedYear}-01-01`).dayOfYear();
  const yearEnd = dayjs(`${selectedYear}-12-31`).dayOfYear();

  const [sortedCycles, setSortedCycles] = useState<Cycle[]>([]);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [valuesReal, setValuesReal] = useState<number[]>(() =>
    sortedCycles.flatMap((cycle) => {
      let start = dayjs(cycle.from).year(selectedYear).dayOfYear();
      let end = dayjs(cycle.to).year(selectedYear).dayOfYear();

      if (dayjs(cycle.from).year() < selectedYear) start = yearStart;
      if (dayjs(cycle.to).year() > selectedYear) end = yearEnd;

      return start < end ? [start, end] : [end, start];
    })
  );

  const cycles = group.cycles;
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const onMouseMove = (e: any) => setMouseX(e.clientX);

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

  const handleDragStart = (index: number) => {
    setDetectedChange(true);
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDraggedDay(null);
  };

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

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      p={3}
      pt={1}
      pb={detectedChange ? 3 : 0}
      width="100%"
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

      <Box flexDirection="row" display="flex" width="100%">
        <Box display="flex" flexDirection="column" width="100%">
          <IconButton
            sx={{
              mb: 2,
              backgroundColor: 'primary.light',
              color: 'white',
              borderRadius: '50%',
              width: 30,
              height: 30,
              '&:hover': { backgroundColor: 'primary.dark' },
            }}
            onClick={() => setShowModal(true)}
          >
            <Add />
          </IconButton>

          {/* Slider */}
          <div
            onMouseMove={onMouseMove}
            ref={sliderRef}
            tabIndex={0}
            style={{ position: 'relative', width: '100%', height: 30 }}
          >
            <Range
              step={1}
              min={yearStart}
              max={yearEnd}
              values={valuesReal}
              onChange={(newValues: number[]) =>
                handleDragChange(
                  sliderRef,
                  { newValues, draggingIndex, mouseX },
                  { setValuesReal }
                )
              }
              onFinalChange={handleDragEnd}
              renderTrack={({ props, children }) => {
                // avoid error when spreading key
                const { ['key']: _, ...otherProps } = props as Record<
                  string,
                  any
                >;

                return (
                  <div
                    {...otherProps}
                    style={{
                      ...props.style,
                      height: 6,
                      width: '100%',
                      backgroundColor: '#ccc',
                      position: 'relative',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    {/* Render colored cycle segments */}
                    {sortedCycles.map((cycle, index) => {
                      const start = valuesReal[index * 2];
                      const end = valuesReal[index * 2 + 1];

                      const left = `${
                        ((start - yearStart) / (yearEnd - yearStart)) * 100
                      }%`;

                      const width = `${
                        ((end - start) / (yearEnd - yearStart)) * 100
                      }%`;

                      return (
                        <div
                          key={cycle.id}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left,
                            width,
                            height: 6,
                            backgroundColor: COLORS[index % COLORS.length],
                            borderRadius: 2,
                            transform: 'translateY(-50%)',
                          }}
                        />
                      );
                    })}

                    {children}
                  </div>
                );
              }}
              renderThumb={({ props, index }) => {
                // avoid error when spreading key
                const { ['key']: _, ...otherProps } = props as Record<
                  string,
                  any
                >;

                const value = valuesReal[index];
                const cycleIndex = Math.floor(index / 2);
                const cycle = sortedCycles[cycleIndex];
                if (!cycle) return null;

                const cycleStartYear = dayjs(cycle.from).year();
                const cycleEndYear = dayjs(cycle.to).year();

                if (value === yearStart && cycleStartYear < selectedYear)
                  return (
                    <div
                      key={index}
                      {...otherProps}
                      style={{
                        ...props.style,
                        height: 0,
                        width: 0,
                        overflow: 'hidden',
                        backgroundColor: 'transparent',
                      }}
                    />
                  );

                if (value === yearEnd && cycleEndYear > selectedYear)
                  return (
                    <div
                      key={index}
                      {...otherProps}
                      style={{
                        ...props.style,
                        height: 0,
                        width: 0,
                        overflow: 'hidden',
                        backgroundColor: 'transparent',
                      }}
                    />
                  );

                return (
                  <div
                    key={index}
                    {...otherProps}
                    onMouseDown={() => handleDragStart(index)}
                    onTouchStart={() => handleDragStart(index)}
                    onMouseMove={() =>
                      handleDrag(
                        { index, value, selectedYear },
                        { setDraggedDay, setValuesReal, sortedCycles }
                      )
                    }
                    style={{
                      ...props.style,
                      height: 14,
                      width: 14,
                      borderRadius: '50%',
                      backgroundColor: COLORS[cycleIndex % COLORS.length],
                      position: 'absolute',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    {/* Floating Label */}
                    {draggingIndex === index && draggedDay !== null && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -24,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: 'black',
                          color: 'white',
                          padding: '4px 6px',
                          borderRadius: 4,
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {dayjs().dayOfYear(draggedDay).format('MMM DD')}
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </div>
          {/* Month Labels */}
          <Stack
            direction="row"
            justifyContent="space-between"
            width="100%"
            mt={1}
          >
            {Array.from({ length: 13 }).map((_, monthIndex) => (
              <Typography key={monthIndex} variant="caption">
                {dayjs().month(monthIndex).format('MMM')}
              </Typography>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Cycle Legends */}
      <Stack direction="row" p={3} spacing={2}>
        {sortedCycles.map((cycle, index) => (
          <Stack
            direction="row"
            key={cycle.id}
            spacing={0.5}
            alignItems="center"
          >
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: COLORS[index % COLORS.length],
                borderRadius: '50%',
              }}
            />
            <Typography sx={{ color: COLORS[index % COLORS.length] }}>
              {cycle.name}
            </Typography>
          </Stack>
        ))}
      </Stack>

      {detectedChange && (
        <Button
          onClick={() =>
            handleUpdateCycleDates(
              token,
              {
                groupId: group.id,
                sortedCycles,
              },
              {
                router,
                group,
                setGroup,
                detectedChange,
                setDetectedChange,
                setSortedCycles,
                valuesReal,
                selectedYear,
                cycle,
                setCycle,
              }
            )
          }
          style={{
            backgroundColor: theme.palette.info.main,
            color: 'white',
            marginRight: 5,
          }}
        >
          Save Changes
        </Button>
      )}
    </Box>
  );
}
