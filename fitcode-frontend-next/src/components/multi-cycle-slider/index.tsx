'use client';

import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { useState, useEffect, useRef } from 'react';
import { Range } from 'react-range';
import { Box, Stack, Typography, IconButton, Button } from '@mui/material';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Cycle } from '@/controller/group/type/cycle.type';
import { COLORS } from '@/common/constant/color.constant';
import { MultiCycleSliderProps } from './type';
import { useScreenSize } from '@/context/screen-size-provider';
import {
  changeYear,
  handleDrag,
  handleDragChange,
  handleUpdateCycleDates,
} from './state';
import { Add } from '@mui/icons-material';

dayjs.extend(dayOfYear);

export default function MultiCycleSlider(props: MultiCycleSliderProps) {
  const screenSize = useScreenSize();
  const {
    token,
    groupId,
    cycles,
    selectedGroup,
    setSelectedGroup,
    selectedCycle,
    setSelectedCycle,
    setShowAddCycleModal,
  } = props;

  const theme = useTheme();
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
        <IconButton
          sx={{
            mr: 2,
            backgroundColor: 'primary.light', // Set primary background color
            color: 'white', // Ensure the icon is visible
            borderRadius: '50%', // Make it round
            width: 30, // Set a fixed width for a perfect circle
            height: 30, // Set a fixed height for a perfect circle
            '&:hover': {
              backgroundColor: 'primary.dark', // Darker shade on hover
            },
          }}
          onClick={() => setShowAddCycleModal(true)}
        >
          <Add />
        </IconButton>

        <Box display="flex" flexDirection="column" width="100%">
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
                  newValues,
                  draggingIndex,
                  sliderRef,
                  mouseX,
                  setValuesReal
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
                        index,
                        value,
                        selectedYear,
                        setDraggedDay,
                        setValuesReal,
                        sortedCycles
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
              groupId,
              selectedGroup,
              setSelectedGroup,
              detectedChange,
              setDetectedChange,
              sortedCycles,
              setSortedCycles,
              valuesReal,
              selectedYear,
              selectedCycle,
              setSelectedCycle
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
