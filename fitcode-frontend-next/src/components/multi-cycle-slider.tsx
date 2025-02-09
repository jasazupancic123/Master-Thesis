'use client';

import { useState, useEffect, useRef } from 'react';
import { Range } from 'react-range';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { Box, Stack, Typography, IconButton, Button } from '@mui/material';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import { useAppContext } from '@/context/app-provider';
import toast from 'react-hot-toast';
import { useTheme } from '@mui/material/styles';
import { Cycle } from '@/controller/group/type/cycle.type';
import { GroupController } from '@/controller/group/group.controller';
import { COLORS } from '@/common/constant/color.constant';

dayjs.extend(dayOfYear);

interface MultiCycleSliderProps {
  group_id: string;
  cycles: Cycle[];
  selected: any;
  setSelected: (selected: any) => void;
}

export default function MultiCycleSlider({
  group_id,
  cycles,
  selected,
  setSelected,
}: MultiCycleSliderProps) {
  const [originalCycles, setOriginalCycles] = useState<Cycle[]>([...cycles]);
  const theme = useTheme();
  const { token } = useAppContext();
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [draggedDay, setDraggedDay] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [detectedChange, setDetectedChange] = useState<boolean>(false);

  const yearStart = dayjs(`${selectedYear}-01-01`).dayOfYear();
  const yearEnd = dayjs(`${selectedYear}-12-31`).dayOfYear();

  const [filteredCycles, setFilteredCycles] = useState<Cycle[]>([]);
  const [sortedCycles, setSortedCycles] = useState<Cycle[]>([]);
  const [mouseX, setMouseX] = useState<number | null>(null);

  const sliderRef = useRef<HTMLDivElement | null>(null); // 👈 Create a ref

  const onMouseMove = (e: any) => {
    let x = e.clientX;
    setMouseX(x);
  };

  useEffect(() => {
    const newFilteredCycles = cycles.filter(
      (cycle) =>
        dayjs(cycle.from).year() === selectedYear ||
        dayjs(cycle.to).year() === selectedYear
    );

    const newSortedCycles = [...newFilteredCycles].sort(
      (a, b) => dayjs(a.from).dayOfYear() - dayjs(b.from).dayOfYear()
    );

    setFilteredCycles(newFilteredCycles);
    setSortedCycles(newSortedCycles);
    //also update values
    setValuesReal(() =>
      newSortedCycles.flatMap((cycle) => {
        let start = dayjs(cycle.from).year(selectedYear).dayOfYear();
        let end = dayjs(cycle.to).year(selectedYear).dayOfYear();

        if (dayjs(cycle.from).year() < selectedYear) start = yearStart;
        if (dayjs(cycle.to).year() > selectedYear) end = yearEnd;

        return start < end ? [start, end] : [end, start];
      })
    );
  }, [cycles, selectedYear]); // ✅ Reactively updates when cycles change

  const [valuesReal, setValuesReal] = useState<number[]>(() =>
    sortedCycles.flatMap((cycle) => {
      let start = dayjs(cycle.from).year(selectedYear).dayOfYear();
      let end = dayjs(cycle.to).year(selectedYear).dayOfYear();

      if (dayjs(cycle.from).year() < selectedYear) start = yearStart;
      if (dayjs(cycle.to).year() > selectedYear) end = yearEnd;

      return start < end ? [start, end] : [end, start];
    })
  );

  // 🔄 Handle dragging and updating cycle values
  const handleChange = (newValues: number[]) => {
    if (draggingIndex !== null) {
      // ✅ Detect if we are dragging the dot BEFORE the `1` value (problem case)
      if (newValues[draggingIndex + 1] === 1 && sliderRef.current) {
        // ✅ Get the slider position & size
        const sliderBounds = sliderRef.current.getBoundingClientRect();
        if (!mouseX) return;
        const relativeX = mouseX - sliderBounds.left; // X position inside the slider
        const sliderWidth = sliderBounds.width;

        // ✅ Convert mouse position to a day-of-year value
        let adjustedValue = Math.round((relativeX / sliderWidth) * 365);

        // ✅ Ensure the value stays within a valid range
        adjustedValue = Math.max(2, Math.min(365, adjustedValue));

        // ✅ Only update the affected dot with the new adjusted value
        setValuesReal((prev) => {
          const updatedValues = [...prev];
          updatedValues[draggingIndex] = adjustedValue;
          return updatedValues;
        });

        return; // ✅ Prevent `Range` from forcing the snap
      }
    }

    // ✅ If no bug detected, update as normal
    setValuesReal([...newValues]);
  };

  const handleDragStart = (index: number) => {
    setDetectedChange(true);
    setDraggingIndex(index);
  };

  const handleDrag = (index: number, value: number) => {
    setDraggedDay(value);

    setValuesReal((prev) => {
      const updated = [...prev];

      const cycleIndex = Math.floor(index / 2);
      if (!sortedCycles[cycleIndex]) return prev; // Ensure cycle exists

      const cycle = sortedCycles[cycleIndex];
      const isStartDot = index % 2 === 0; // Even index = start, Odd index = end

      // Ensure correct year boundaries
      if (isStartDot && dayjs(cycle.from).year() < selectedYear) {
        return prev; // Prevent the start dot from moving back into previous years
      }
      if (!isStartDot && dayjs(cycle.to).year() > selectedYear) {
        return prev; // Prevent the end dot from moving back into previous years
      }

      updated[index] = value;
      return updated;
    });
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDraggedDay(null);
  };

  useEffect(() => {
    if (draggingIndex !== null) return; // Prevent overriding dragged values

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
  }, [selectedYear, sortedCycles]); // ✅ Now updates when cycles change

  const changeYear = (direction: 'prev' | 'next') => {
    setSelectedYear((prev) => (direction === 'prev' ? prev - 1 : prev + 1));
  };

  const handleUpdateCycleDates = async () => {
    if (!detectedChange) return;

    //look for date changes in between original cycles and sortedCycles
    const updatedCycles = sortedCycles
      .map((cycle, index) => {
        const startValue = valuesReal[index * 2];
        const endValue = valuesReal[index * 2 + 1];

        const cycleStartDays = dayjs(cycle.from).dayOfYear();
        const cycleEndDays = dayjs(cycle.to).dayOfYear();

        let foundUpdate = false;
        const cycle_: any = {
          id: cycle.id,
          name: cycle.name,
          description: cycle.description,
        };

        if (
          dayjs(cycle.from).year() === selectedYear &&
          cycleStartDays !== startValue
        ) {
          foundUpdate = true;
          cycle_.from = dayjs()
            .dayOfYear(startValue)
            .year(selectedYear)
            .toDate();
        } else {
          cycle_.from = cycle.from;
        }

        if (
          dayjs(cycle.to).year() === selectedYear &&
          cycleEndDays !== endValue
        ) {
          foundUpdate = true;
          cycle_.to = dayjs().dayOfYear(endValue).year(selectedYear).toDate();
        } else {
          cycle_.to = cycle.to;
        }

        if (!foundUpdate) return null;

        return cycle_;
      })
      .filter(Boolean);

    if (updatedCycles.length === 0) {
      toast.error('No changes detected.');
      return;
    }

    try {
      for (const cycle of updatedCycles) {
        if (!cycle) continue;
        await GroupController.updateCycle(token, group_id, cycle.id, {
          name: cycle.name,
          description: cycle.description,
          from: cycle.from,
          to: cycle.to,
        });
      }

      const newCycles = selected.group.cycles.map((item: Cycle) => {
        const updatedCycle = updatedCycles.find(
          (cycle) => cycle?.id === item.id
        );
        return updatedCycle ? updatedCycle : item;
      });

      setSelected((prev: any) => {
        if (!prev.group) return prev;

        return {
          ...prev,
          group: {
            ...prev.group,
            cycles: newCycles,
          },
        };
      });

      setDetectedChange(false);
      setOriginalCycles(newCycles);
      setSortedCycles(newCycles);
      toast.success('Cycles updated successfully!');
    } catch (error: any) {
      if (error.message?.toLowerCase().includes('overlap')) {
        toast.error('Cycle dates overlap with an existing cycle.');
        return;
      }
      toast.error('Failed to update cycles.');
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      p={3}
      width="100%"
    >
      {/* Year Navigation */}
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <IconButton onClick={() => changeYear('prev')}>
          <ArrowLeft />
        </IconButton>
        <Typography variant="h6">{selectedYear}</Typography>
        <IconButton onClick={() => changeYear('next')}>
          <ArrowRight />
        </IconButton>
      </Stack>

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
          onChange={(newValues: any) => {
            handleChange(newValues);
          }}
          onFinalChange={handleDragEnd}
          renderTrack={({ props, children }) => (
            <div
              {...props}
              style={{
                ...props.style,
                height: 6,
                width: '100%',
                backgroundColor: '#ccc',
                position: 'relative', // ✅ Change from 'absolute' to 'relative' to ensure correct alignment
                top: '50%', // ✅ Center the track within its container
                transform: 'translateY(-50%)', // ✅ Ensure the track is properly centered
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
          )}
          renderThumb={({ props, index }) => {
            const value = valuesReal[index];
            const cycleIndex = Math.floor(index / 2);
            const cycle = sortedCycles[cycleIndex];

            if (!cycle) return null;

            const cycleStartYear = dayjs(cycle.from).year();
            const cycleEndYear = dayjs(cycle.to).year();

            // 🔥 Fix: Instead of returning `null`, make the thumb invisible
            if (value === yearStart && cycleStartYear < selectedYear) {
              return (
                <div
                  {...props}
                  style={{
                    ...props.style,
                    height: 0, // Make it invisible
                    width: 0,
                    overflow: 'hidden',
                    backgroundColor: 'transparent',
                  }}
                />
              );
            }

            if (value === yearEnd && cycleEndYear > selectedYear) {
              return (
                <div
                  {...props}
                  style={{
                    ...props.style,
                    height: 0,
                    width: 0,
                    overflow: 'hidden',
                    backgroundColor: 'transparent',
                  }}
                />
              );
            }

            return (
              <div
                {...props}
                onMouseDown={() => handleDragStart(index)}
                onTouchStart={() => handleDragStart(index)}
                onMouseMove={() => handleDrag(index, value)}
                style={{
                  ...props.style,
                  height: 14,
                  width: 14,
                  borderRadius: '50%',
                  backgroundColor: COLORS[cycleIndex % COLORS.length],
                  position: 'absolute', // ✅ Make sure thumbs are positioned relative to the track
                  transform: 'translateY(-50%)', // ✅ Ensure vertical alignment
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
      <Stack direction="row" justifyContent="space-between" width="100%" mt={1}>
        {Array.from({ length: 13 }).map((_, monthIndex) => (
          <Typography key={monthIndex} variant="caption">
            {dayjs().month(monthIndex).format('MMM')}
          </Typography>
        ))}
      </Stack>

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
          onClick={() => {
            handleUpdateCycleDates(); // ✅ Save changes
          }}
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
