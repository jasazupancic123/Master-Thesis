import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { addMinutes } from 'date-fns';
import dayjs from 'dayjs';
import React from 'react';

import {
  getFilteredTrainings,
  handleClickDateCell,
} from '../actions/actions-week-date';
import { TrainingGridItem } from '@/components/trainer-group-cycle-view/components/training-cycle-view-grid-item/training-cycle-view-grid-item';
import type { Component } from '@/core/component/type/component.type';
import type { Target } from '@/core/target/type/target.type';
import { MainSet } from '@/core/training/enum/main-set.enum';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { lib } from '@/lib';
import type { SetState } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';

interface TrainingWeekDatesProps {
  week: dayjs.Dayjs[];
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
}

export default function TrainingWeekDates(props: TrainingWeekDatesProps) {
  const theme = useTheme();

  const { user } = useAuthenticatedAuth();
  const mainContext = useMain();
  const groupContext = useGroup();

  const { components } = mainContext;
  const { cycle, trainings } = groupContext;

  const {
    week,
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
            components.length &&
            cycle &&
            lib.common.date.isBetween(date, cycle.from, cycle.to) &&
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
              <Box
                key={period}
                sx={{
                  position: 'relative',
                  height: '70px !important',
                  borderRight:
                    j < 6
                      ? `2px solid ${theme.palette.background.light}`
                      : 'none',
                  backgroundColor: isBeforeToday
                    ? theme.palette.background.default
                    : undefined,
                  borderBottom:
                    period === 'PM' && isInCycle
                      ? `1px solid transparent`
                      : 'none',
                  backgroundImage:
                    period === 'PM' && isInCycle
                      ? `repeating-linear-gradient(
                          to right,
                          ${theme.palette.background.lightBorder} 0,
                          ${theme.palette.background.lightBorder} 6px,
                          transparent 6px,
                          transparent 12px
                        )`
                      : 'none',
                  backgroundRepeat: 'repeat-x',
                  backgroundPosition: 'bottom left',
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
                    },
                    groupContext,
                    mainContext
                  );
                }}
              >
                {period === 'AM' && (
                  <Typography
                    sx={{
                      position: 'absolute',
                      top: 4,
                      left: 6,
                      fontSize: '0.7rem',
                      opacity: 0.7,
                      zIndex: 1,
                      fontWeight: isSameDayAsToday ? 1000 : undefined,
                    }}
                  >
                    {dateString}
                  </Typography>
                )}

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
                      height="70px !important"
                      sx={{
                        cursor: 'pointer',
                        p: 0,
                        m: 0,
                        backgroundColor: componentCalendarView
                          ? '#1e3045'
                          : undefined,
                      }}
                      onClick={(e) => {
                        if (
                          !cycle ||
                          !lib.common.date.isBetween(date, cycle.from, cycle.to)
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
                            id: c.id,
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
            </React.Fragment>
          );
        })}
      </Box>
    );
  });
}
