'use client';

import { COLORS } from '@/common/constant/color.constant';
import { SetState } from '@/common/type/state.type';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { Cycle, Week } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Add, ArrowLeft, ArrowRight } from '@mui/icons-material';
import { Box, IconButton, Stack, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { useEffect, useRef, useState } from 'react';
import { Range } from 'react-range';
import { changeYear, handleAddCycle, handleDrag } from './state';

dayjs.extend(dayOfYear);

interface MultiCycleSliderProps {
  selectedGroup: Group;
  setSelectedGroup: SetState<Group>;
}

export default function MultiCycleSlider(props: MultiCycleSliderProps) {
  const { selectedGroup, setSelectedGroup } = props;

  const screenSize = useScreenSize();
  const {
    group,
    setCycle,
    setGroup,
    setDetectedChanges,
    cycle: selectedCycle,
  } = useGroup();

  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [draggedDay, setDraggedDay] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

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

  const [cycles, setCycles] = useState<Cycle[]>([]);
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

  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  useEffect(() => {
    if (!sliderRef.current) return;

    const sliderBounds = sliderRef.current.getBoundingClientRect();
    console.log('Slider dimensions:', sliderBounds);
  }, [sliderRef.current]); // Runs when the sliderRef is set

  const handleChange = (newValues: number[]) => {
    if (draggingIndex !== null) {
      if (newValues[draggingIndex + 1] === 1 && sliderRef.current) {
        //Get the slider position & size
        const sliderBounds = sliderRef.current.getBoundingClientRect();
        if (!mouseX) return;
        const relativeX = mouseX - sliderBounds.left; // X position inside the slider
        const sliderWidth = sliderBounds.width;

        let adjustedValue = Math.round((relativeX / sliderWidth) * 365);
        adjustedValue = Math.max(2, Math.min(365, adjustedValue));

        setValuesReal((prev) => {
          const updatedValues = [...prev];
          updatedValues[draggingIndex] = adjustedValue;
          return updatedValues;
        });

        return;
      }
    }

    setDetectedChanges(true);
    setValuesReal([...newValues]);
  };

  const handleDragEnd = () => {
    if (!selectedGroup) return;

    if (draggingIndex === undefined || draggingIndex === null) return;
    const cycleIndex = Math.floor(draggingIndex / 2);
    if (!sortedCycles[cycleIndex]) return;

    const cycle = { ...[...sortedCycles][cycleIndex] };
    const isStartDot = draggingIndex % 2 === 0; // Even index = start, Odd index = end

    // Ensure correct year boundaries
    if (isStartDot && dayjs(cycle.from).year() < selectedYear) return; // Prevent the start dot from moving back into previous years
    if (!isStartDot && dayjs(cycle.to).year() > selectedYear) return; // Prevent the end dot from moving back into previous years

    let from = cycle.from;
    let to = cycle.to;

    if (isStartDot) {
      from = dayjs()
        .year(selectedYear) // Set the desired year first
        .dayOfYear(valuesReal[cycleIndex * 2])
        .startOf('week') // Moves to the start of the week (usually Sunday)
        .add(1, 'day') // Adjusts to Monday
        .toDate();
    } else {
      to = dayjs()
        .year(selectedYear) // Set the desired year first
        .dayOfYear(valuesReal[cycleIndex * 2 + 1])
        .startOf('week') // Moves to the start of the week (usually Sunday)
        .toDate();
    }

    const weeks: Week[][] = Array.from(
      { length: dayjs(to).diff(from, 'week') + 2 },
      (_, i) => {
        const startOfWeek = dayjs(from).add(i, 'w').startOf('w');
        return Array.from({ length: 7 }, (_, j) => ({
          date: startOfWeek.add(j, 'd').toDate(),
        }));
      }
    );

    const newCycle = {
      ...cycle,
      from: from,
      to: to,
      weeks: weeks,
    };

    const newCycles = [
      ...selectedGroup.cycles.map(({ ...c }) =>
        c.id === cycle.id ? newCycle : c
      ),
    ];

    const newGroup = { ...selectedGroup, cycles: newCycles };
    setSelectedGroup(newGroup);

    setDraggingIndex(null);
    setDraggedDay(null);
  };

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
              { selectedGroup, setSelectedGroup, setCycles, setDetectedChanges }
            );
          }}
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
              step={7}
              min={yearStart}
              max={yearEnd}
              values={valuesReal}
              onChange={(newValues: number[]) => {
                handleChange(newValues);
              }}
              onFinalChange={handleDragEnd}
              renderTrack={({ props, children }) => {
                const { ['key']: _, ...otherProps } = props as Record<
                  string,
                  any
                >;

                const handleNameChange = (index: number, newName: string) => {
                  const newCycle = sortedCycles[index];
                  console.log(
                    'newCycle:',
                    '\n',
                    newCycle.from,
                    '\n',
                    newCycle.to
                  );
                  if (!newCycle) return;
                  const updatedCycles = [...cycles].map((cycle, i) =>
                    cycle.id === newCycle.id
                      ? { ...cycle, name: newName }
                      : cycle
                  );
                  setCycles(updatedCycles);
                  setGroup({ ...group, cycles: updatedCycles });

                  setSortedCycles((prevCycles) => {
                    const updatedCycles = prevCycles.map((cycle, i) =>
                      cycle.id === newCycle.id
                        ? { ...cycle, name: newName }
                        : cycle
                    );
                    return updatedCycles;
                  });
                  setDetectedChanges(true);
                };

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
                    {/* Editable Cycle Names */}
                    {sortedCycles.map((cycle, index) => {
                      const start = valuesReal[index * 2];
                      const end = valuesReal[index * 2 + 1];

                      const centerPosition = `${
                        (((start + end) / 2 - yearStart) /
                          (yearEnd - yearStart)) *
                        100
                      }%`;

                      return (
                        <div
                          key={cycle.id}
                          style={{
                            position: 'absolute',
                            top:
                              cycles.indexOf(
                                cycles.find((c) => c.id === cycle.id)!
                              ) %
                                2 ===
                              0
                                ? '-25px'
                                : '15px',
                            left: centerPosition,
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap',
                            zIndex: 0, // Ensure it's above slider
                            pointerEvents: 'auto',
                          }}
                        >
                          <TextField
                            variant="standard"
                            value={cycle.name}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()} // Stops blocking mouse events
                            onFocus={(e) => e.stopPropagation()} // Ensures it can be focused
                            onChange={(e) =>
                              handleNameChange(index, e.target.value)
                            }
                            inputProps={{
                              style: {
                                textAlign: 'center',
                                fontSize: 12,
                                fontWeight: 'bold',
                                color: COLORS[index % COLORS.length],
                              },
                            }}
                            sx={{
                              '& .MuiInput-underline:before': {
                                borderBottom: 'none !important',
                              },
                              '& .MuiInput-underline:hover:before': {
                                borderBottom: 'none !important',
                              },
                              '& .MuiInput-underline:after': {
                                borderBottom: 'none !important',
                              },
                              '& .MuiInputBase-input': {
                                borderBottom: 'none !important',
                              },
                            }}
                          />
                        </div>
                      );
                    })}

                    {/* Render Colored Cycle Segments */}
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
                        { setDraggedDay, setValuesReal, sortedCycles },
                        setDetectedChanges
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
