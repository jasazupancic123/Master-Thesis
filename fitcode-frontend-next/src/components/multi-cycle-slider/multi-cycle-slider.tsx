'use client';

import { Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Range } from 'react-range';

import EditCycleForm from '../edit-cycle-form/edit-cycle-form';
import MyModal from '../modal/modal';
import {
  handleChange,
  handleDrag,
  handleDragEnd,
} from '../multi-cycle-slider-layout/state';
import { handleApiRequest, type SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Group } from '@/controller/group/type/group.type';
import { useGroup } from '@/store/group-provider';

dayjs.extend(dayOfYear);

interface MultiCycleSliderProps {
  selectedGroup: Group;
  setSelectedGroup: SetState<Group>;
  valuesReal: number[];
  setValuesReal: SetState<number[]>;
  draggingIndex: number | null;
  setDraggingIndex: SetState<number | null>;
  sliderRef: React.RefObject<HTMLDivElement | null>;
  selectedYear: number;
  sortedCycles: Cycle[];
  yearStart: number;
  yearEnd: number;
  sliderProperties: {
    width: string;
    centerPosition: string;
  }[];
  setSortedCycles: SetState<Cycle[]>;
  setCycles: SetState<Cycle[]>;
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
    sliderProperties,
    setSortedCycles,
    setCycles,
  } = props;

  const { setGroup } = useGroup();

  const router = useRouter();
  const theme = useTheme();

  const { cycle, setCycle, setDetectedChanges } = useGroup();

  const [draggedDay, setDraggedDay] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [openEditCycleModal, setOpenEditCycleModal] = useState(false);
  const [editCycle, setEditCycle] = useState<Cycle | null>(null);

  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) =>
    setMouseX(e.clientX);

  async function handleDeleteCycle() {
    if (!editCycle || !selectedGroup) return;

    handleApiRequest(
      router,
      () => GroupController.removeCycle(selectedGroup.id, editCycle.id),
      () => {
        if (cycle && editCycle.id === cycle?.id) setCycle(undefined);

        setSortedCycles((prev) => prev.filter((c) => c.id !== editCycle.id));
        setCycles((prev) => prev.filter((c) => c.id !== editCycle.id));

        setSelectedGroup((prev) => ({
          ...prev,
          cycles: prev.cycles.filter((c) => c.id !== editCycle.id),
        }));
        setGroup((prev) => ({
          ...prev,
          cycles: prev.cycles.filter((c) => c.id !== editCycle.id),
        }));

        setEditCycle(null);

        toast.success('Cycle deleted successfully');
      },
      (_e) => {
        toast.error('An error occurred while deleting the cycle.');
      }
    );
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
