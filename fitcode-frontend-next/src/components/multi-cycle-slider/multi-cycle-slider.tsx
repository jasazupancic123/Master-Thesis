'use client';

import { COLORS } from '@/common/constant/color.constant';
import { SetState } from '@/common/type/state.type';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { Cycle, Week } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Add, ArrowLeft, ArrowRight } from '@mui/icons-material';
import { Box, IconButton, Stack, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { useEffect, useRef, useState } from 'react';
import { Range } from 'react-range';
import {
  handleDrag,
  handleChange,
  handleDragEnd,
} from '../multi-cycle-slider-layout/state';

dayjs.extend(dayOfYear);

interface MultiCycleSliderProps {
  selectedGroup: Group;
  setSelectedGroup: SetState<Group>;
  valuesReal: number[];
  setValuesReal: SetState<number[]>;
  cycles: Cycle[];
  setCycles: SetState<Cycle[]>;
  draggingIndex: number | null;
  setDraggingIndex: SetState<number | null>;
  sliderRef: React.RefObject<HTMLDivElement | null>;
  selectedYear: number;
  sortedCycles: Cycle[];
  yearStart: number;
  yearEnd: number;
  setSortedCycles: SetState<Cycle[]>;
}

export default function MultiCycleSlider(props: MultiCycleSliderProps) {
  const {
    selectedGroup,
    setSelectedGroup,
    valuesReal,
    setValuesReal,
    draggingIndex,
    setDraggingIndex,
    selectedYear,
    sortedCycles,
    sliderRef,
    yearStart,
    yearEnd,
    setCycles,
    setSortedCycles,
    cycles,
  } = props;

  const { group, setGroup, setDetectedChanges } = useGroup();

  const [draggedDay, setDraggedDay] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const onMouseMove = (e: any) => setMouseX(e.clientX);

  return (
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
          handleChange(
            {
              newValues,
              draggingIndex,
              mouseX,
            },
            { sliderRef, setValuesReal, setDetectedChanges }
          );
        }}
        onFinalChange={() =>
          handleDragEnd(
            {
              draggingIndex,
              selectedYear,
              sortedCycles,
              valuesReal,
            },
            {
              selectedGroup,
              setSelectedGroup,
              setDraggingIndex,
              setDraggedDay,
            }
          )
        }
        renderTrack={({ props, children }) => {
          const { ['key']: _, ...otherProps } = props as Record<string, any>;

          const handleNameChange = (index: number, newName: string) => {
            const newCycle = sortedCycles[index];
            if (!newCycle) return;

            const updatedCycles = [...cycles].map((cycle, i) =>
              cycle.id === newCycle.id ? { ...cycle, name: newName } : cycle
            );

            setDetectedChanges(true);
            setCycles(updatedCycles);
            setGroup({ ...group, cycles: updatedCycles });
            setSortedCycles((prevCycles) => {
              const updatedCycles = prevCycles.map((cycle, i) =>
                cycle.id === newCycle.id ? { ...cycle, name: newName } : cycle
              );
              return updatedCycles;
            });
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
                  (((start + end) / 2 - yearStart) / (yearEnd - yearStart)) *
                  100
                }%`;

                return (
                  <div
                    key={cycle.id}
                    style={{
                      position: 'absolute',
                      top:
                        cycles.indexOf(cycles.find((c) => c.id === cycle.id)!) %
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
                      onChange={(e) => handleNameChange(index, e.target.value)}
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
          const { ['key']: _, ...otherProps } = props as Record<string, any>;

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
  );
}
