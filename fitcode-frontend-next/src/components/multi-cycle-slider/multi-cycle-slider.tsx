'use client';

import { SetState } from '@/common/type/state.type';
import { useGroup } from '@/store/group-provider';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Typography } from '@mui/material';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { useState } from 'react';
import { Range } from 'react-range';
import {
  handleDrag,
  handleChange,
  handleDragEnd,
} from '../multi-cycle-slider-layout/state';
import { useTheme } from '@mui/material';
import MyModal from '../modal/modal';
import EditCycleForm from '../edit-cycle-form/edit-cycle-form';

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
  sliderProperties: {
    width: string;
    centerPosition: string;
  }[];
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
    sliderProperties,
  } = props;

  const theme = useTheme();

  const { group, setGroup, cycle, setCycle, setDetectedChanges } = useGroup();

  const [draggedDay, setDraggedDay] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [openEditCycleModal, setOpenEditCycleModal] = useState(false);
  const [editCycle, setEditCycle] = useState<Cycle | null>(null);

  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const onMouseMove = (e: any) => setMouseX(e.clientX);

  function handleDeleteCycle() {
    if (!editCycle || !selectedGroup) return;

    const updatedCycles = [...selectedGroup.cycles].filter(
      (cycle) => cycle.id !== editCycle.id
    );

    if (cycle && editCycle.id === cycle?.id) setCycle(undefined);
    setSelectedGroup({ ...selectedGroup, cycles: updatedCycles });
    setEditCycle(null);
    setDetectedChanges(true);
  }

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
      {editCycle && (
        <MyModal
          isOpen={openEditCycleModal}
          setIsOpen={(open) => setOpenEditCycleModal(open)}
          onCancel={() => setOpenEditCycleModal(false)}
          cancelText="Close"
          onConfirm={() => {
            const newCycles = selectedGroup.cycles.map((c) =>
              c.id === editCycle.id ? { ...editCycle } : c
            );
            setSelectedGroup({ ...selectedGroup, cycles: newCycles });
            setDetectedChanges(true);
            setOpenEditCycleModal(false);
          }}
        >
          <EditCycleForm
            selectedCycle={editCycle}
            setSelectedCycle={setEditCycle}
            handleDeleteCycle={handleDeleteCycle}
          />
        </MyModal>
      )}
    </div>
  );
}
