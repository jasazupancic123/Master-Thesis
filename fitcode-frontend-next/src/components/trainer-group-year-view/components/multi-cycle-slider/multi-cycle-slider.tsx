'use client';

import { Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import React, { useState } from 'react';
import { Range } from 'react-range';

import { useMultiCycleSliderCyclesProvider } from '../../context/cycles.provider';
import { useMultiCycleSliderYearProvider } from '../../context/years.provider';
import {
  handleChange,
  handleDrag,
  handleDragEnd,
} from './components/multi-cycle-slider-layout/actions/actions-dragging';
import type { UseSliderPropertiesReturnType } from './hooks/use-slider-properties';
import EditCycleModal from './modals/edit-cycle-modal';
import { useGroup } from '@/store/group.provider';

dayjs.extend(dayOfYear);

interface MultiCycleSliderProps {
  sliderRef: React.RefObject<HTMLDivElement | null>;
  useSliderProperties: UseSliderPropertiesReturnType;
}

export default function MultiCycleSlider(props: MultiCycleSliderProps) {
  const theme = useTheme();

  const groupContext = useGroup();
  const cyclesContext = useMultiCycleSliderCyclesProvider();
  const yearContext = useMultiCycleSliderYearProvider();

  const { sliderRef, useSliderProperties } = props;

  const {
    valuesReal,
    setValuesReal,
    draggingIndex,
    setDraggingIndex,
    sliderProperties,
  } = useSliderProperties;

  const { selectedYear, yearStart, yearEnd } = yearContext;

  const { sortedCycles, setEditCycle } = cyclesContext;

  const { setDetectedChanges } = groupContext;

  const [draggedDay, setDraggedDay] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [openEditCycleModal, setOpenEditCycleModal] = useState(false);

  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) =>
    setMouseX(e.clientX);

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
        allowOverlap={false}
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
              setDraggingIndex,
              setDraggedDay,
            },
            {
              useGroup: groupContext,
              useYear: yearContext,
              useSliderProperties: useSliderProperties,
              useSliderCycles: cyclesContext,
            }
          )
        }
        renderTrack={({ props, children }) => {
          return (
            <div
              {...props}
              style={{
                ...props.style,
                height: 4,
                borderRadius: 2,
                width: '100%',
                backgroundColor: theme.palette.text.primary,
                position: 'relative',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              {/* Editable Cycle Names */}
              {sliderProperties.length > 0 &&
                sortedCycles.map((cycle, index) => {
                  const sliderProperty = sliderProperties[index];
                  if (!sliderProperty) return null;

                  const centerPosition = sliderProperty.centerPosition;
                  const width = sliderProperty.width;

                  return (
                    <div
                      key={cycle.id}
                      style={{
                        position: 'absolute',
                        top: '-30px',
                        left: centerPosition,
                        transform: 'translateX(-50%)',
                        width,
                      }}
                    >
                      <Typography
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenEditCycleModal(true);
                          setEditCycle(cycle);
                        }}
                        sx={{
                          textAlign: 'center',
                          fontSize: 14,
                          fontWeight: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                          color: theme.palette.text.primary,
                          cursor: 'pointer',
                        }}
                      >
                        {cycle.name}
                      </Typography>
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
                      height: 4,
                      backgroundColor: theme.palette.primary.main,
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
          const value = valuesReal[index];
          const cycleIndex = Math.floor(index / 2);
          const cycle = sortedCycles[cycleIndex];
          if (!cycle) return null;

          const cycleStartYear = dayjs(cycle.from).year();
          const cycleEndYear = dayjs(cycle.to).year();

          const { key, ...rest } = props;

          if (value === yearStart && cycleStartYear < selectedYear)
            return (
              <div
                key={key}
                {...rest}
                style={{
                  ...rest.style,
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
                key={key}
                {...rest}
                style={{
                  ...rest.style,
                  height: 0,
                  width: 0,
                  overflow: 'hidden',
                  backgroundColor: 'transparent',
                }}
              />
            );

          return (
            <div
              key={key}
              {...rest}
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
                ...rest.style,
                height: 13,
                width: 13,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
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

      <EditCycleModal
        open={openEditCycleModal}
        setOpen={setOpenEditCycleModal}
      />
    </div>
  );
}
