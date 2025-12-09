import { useDroppable } from '@dnd-kit/core';
import type { SxProps } from '@mui/material';
import { alpha, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { addMinutes } from 'date-fns';
import dayjs from 'dayjs';
import React from 'react';

import {
  getFilteredTrainings,
  handleClickDateCell,
} from './actions/actions-week-date';
import { TrainingGridItem } from '@/components/trainer-group-cycle-view/training-cycle-view-grid-item';
import type { Component } from '@/core/exercise/type/component.type';
import type { Target } from '@/core/exercise/type/target.type';
import { MainSet } from '@/core/training/enum/main-set.enum';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { lib } from '@/lib';
import type { SetState } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useDefaultDates } from '@mui/x-date-pickers/internals';

interface TrainingWeekDatesProps {
  week: dayjs.Dayjs[];
  weekIndex?: number;
  componentCalendarView?: boolean;
  periodizationView?: boolean;
  cycleView?: boolean;
  copyComponent?: boolean;
  trainingComponent?: TrainingComponent;
  training?: Training;
  selectedTrainings?: Training[];
  setSelectedTrainings?: SetState<Training[]>;
  selected?: Component[];
  selectedTarget?: Target;
  selectedTargets?: { componentId: string; target: Target }[];
  setOpenAreYouSureModal: SetState<boolean>;
  setSelectedTraining: SetState<Training | null>;
  setOpenOverwriteModal?: SetState<boolean>;
  setTrainingInPeriodForModal?: SetState<Training | null>;
  addTrainingComponent: (
    trainingId: string,
    data: { components: TrainingComponent[] }
  ) => void;
  deleteTrainingComponent: (
    trainingId: string,
    componentId: string
  ) => Promise<void>;
  setIsCreatingTraining?: SetState<boolean>;
}

export default function TrainingWeekDates(props: TrainingWeekDatesProps) {
  const theme = useTheme();

  const { user } = useAuthenticatedAuth();
  const mainContext = useMain();
  const groupContext = useGroup();

  const { cycle, trainings } = groupContext;

  const {
    week,
    weekIndex,
    componentCalendarView,
    periodizationView,
    cycleView,
    copyComponent,
    trainingComponent,
    training,
    selectedTrainings,
    setSelectedTrainings,
    selected,
    selectedTarget,
    selectedTargets,
    setOpenAreYouSureModal,
    setSelectedTraining,
    setOpenOverwriteModal,
    setTrainingInPeriodForModal,
    addTrainingComponent,
    deleteTrainingComponent,
    setIsCreatingTraining,
  } = props;

  return week.map((date, j) => {
    const isInCycle =
      cycle &&
      dayjs(cycle.from).isBefore(date.endOf('day')) &&
      dayjs(cycle.to).isAfter(date.endOf('day'));
    return (
      <Box
        key={j}
        width="calc(100% / 7)"
        sx={{
          backgroundColor: theme.palette.background.default,
          cursor:
            cycle &&
            lib.common.date.isBetween(
              date,
              dayjs(cycle.from).startOf('day').toDate(),
              dayjs(cycle.to).endOf('day').toDate()
            ) &&
            !dayjs(date).isBefore(dayjs(), 'day')
              ? 'pointer'
              : 'default',
        }}
      >
        {['AM', 'PM'].map((period) => {
          const dateString = dayjs(date).format('D. M.');
          const isSameDayAsToday = dayjs(date).isSame(dayjs(), 'day');
          const isBeforeToday = dayjs(date).isBefore(dayjs(), 'day');

          return (
            <React.Fragment key={period}>
              <DateCell date={date.toDate()} period={period as 'AM' | 'PM'}>
                {period === 'AM' && (
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      opacity: 0.7,
                      zIndex: 1,
                      fontWeight: isSameDayAsToday ? 800 : 600,
                      backgroundColor: isSameDayAsToday
                        ? theme.palette.primary.main
                        : theme.palette.background.dark,
                      color: isSameDayAsToday
                        ? theme.palette.background.default
                        : theme.palette.text.primary,
                      borderRadius: '4px',
                      px: 0.5,
                    }}
                  >
                    {dateString}
                  </Typography>
                )}
                <Box
                  key={period}
                  sx={{
                    position: 'relative',
                    height: '60px !important',
                    borderRight:
                      j < 6
                        ? `1px solid ${alpha(theme.palette.text.primary, 0.075)}`
                        : 'none',
                    backgroundImage:
                      period === 'PM' && isInCycle
                        ? `repeating-linear-gradient(
                          to right,
                          ${alpha(theme.palette.background.lightBorder, 0.3)} 0,
                          ${alpha(theme.palette.background.lightBorder, 0.3)} 3px,
                          transparent 3px,
                          transparent 7px
                        )`
                        : 'none',
                    backgroundRepeat: 'repeat-x',
                    backgroundPosition: 'top left',
                    backgroundSize: '14px 1px', // controls dash+gap
                  }}
                  onClick={() => {
                    handleClickDateCell(
                      user.uid,
                      {
                        date,
                        period,
                        componentCalendarView,
                        periodizationView,
                        copyComponent,
                        trainingComponent,
                        selected,
                        selectedTargets,
                        setOpenOverwriteModal,
                        setTrainingInPeriodForModal,
                        setIsCreatingTraining,
                      },
                      groupContext,
                      mainContext
                    );
                  }}
                >
                  {/* Trainings */}
                  {getFilteredTrainings(date, {
                    periodizationView,
                    trainingComponent,
                    trainings,
                    selectedTrainings,
                    date,
                    selected,
                    period,
                  }).map((training_, key) => {
                    return (
                      <Box
                        key={key}
                        sx={{
                          cursor: 'pointer',
                          p: 0,
                          m: 0,
                        }}
                        onClick={(e) => {
                          if (
                            !cycle ||
                            !lib.common.date.isBetween(
                              date,
                              cycle.from,
                              cycle.to
                            )
                          )
                            return;

                          if (!props.selected || props.selected?.length === 0) {
                            if (!periodizationView) {
                              setOpenAreYouSureModal(true);
                              setSelectedTraining(training_);
                              return;
                            }
                            return;
                          }

                          e.stopPropagation();

                          const lastTo = new Date(
                            training_.components[
                              training_.components.length - 1
                            ].to
                          );

                          addTrainingComponent(training_.id, {
                            components: props.selected?.map((c, i) => ({
                              id: c.field,
                              subgroups: [],
                              supersets: [],
                              mainSet: MainSet.BLOCK,
                              from: addMinutes(lastTo, i * 30),
                              to: addMinutes(addMinutes(lastTo, i * 30), 30),
                            })),
                          });
                        }}
                      >
                        <TrainingGridItem
                          order={key + 1}
                          training={training_}
                          addTrainingComponent={props.addTrainingComponent}
                          deleteTrainingComponent={deleteTrainingComponent}
                          selected={selectedTrainings?.some(
                            (t) => t.id === training_.id
                          )}
                          selectedTrainings={selectedTrainings}
                          setSelectedTrainings={setSelectedTrainings}
                          componentCalendarView={componentCalendarView}
                          periodizationView={periodizationView}
                          cycleView={cycleView}
                          trainingComponent={trainingComponent}
                          isSameDayAsSelectedComponent={
                            trainingComponent &&
                            dayjs(training_.from).isSame(
                              dayjs(trainingComponent.from),
                              'date'
                            ) &&
                            dayjs(training_.from).hour() >= 12 ===
                              dayjs(trainingComponent.from).hour() >= 12
                          }
                          basePeriodizationTraining={training}
                          selectedTarget={selectedTarget}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </DateCell>
            </React.Fragment>
          );
        })}
      </Box>
    );
  });
}

type DateCellProps = {
  date: Date;
  period: 'AM' | 'PM';
  children: React.ReactNode;
  onClick?: () => void;
  sx?: SxProps;
};

function DateCell({ date, period, children, onClick, sx }: DateCellProps) {
  const id = `cell-${date.toISOString()}-${period}`;
  const { setNodeRef, isOver } = useDroppable({ id, data: { date, period } });

  return (
    <Box
      ref={setNodeRef}
      onClick={onClick}
      sx={{
        ...(sx || {}),
        backgroundColor: isOver ? 'rgba(255,255,255,0.2)' : undefined,
      }}
    >
      {children}
    </Box>
  );
}
