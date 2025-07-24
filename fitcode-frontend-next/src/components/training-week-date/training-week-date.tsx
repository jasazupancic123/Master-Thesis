import { CommonService } from '@/common/service/common.service';
import { TrainingGridItem } from '@/components/training-cycle-view-grid-item/training-cycle-view-grid-item';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { Divider } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Training } from '@/controller/training/type/training.type';
import { addMinutes } from 'date-fns';
import { SetState } from '@/common/type/state.type';
import { TrainingComponent } from '@/controller/training/type/training-component.type';
import { getFilteredTrainings, handleClickDateCell } from './state';
import { Target } from '@/controller/target/type/target.type';
import { Component } from '@/controller/component/type/component.type';
import { AddTrainingComponents } from '../trainer-cycle-view/type';
import { TrainingInfo } from '@/controller/training/type/training.type';
import { Day } from '@/common/service/util/date.util';
import { useTheme } from '@mui/material';
import { useMain } from '@/store/main-provider';

interface TrainingWeekDatesProps {
  week: dayjs.Dayjs[];
  componentCalendarView?: boolean;
  periodizationView?: boolean;
  cycleView?: boolean;
  copyComponent?: boolean;
  trainingComponent?: TrainingComponent;
  training?: Training;
  selectedTrainings?: TrainingInfo[];
  setSelectedTrainings?: SetState<TrainingInfo[]>;
  selected?: Component[];
  selectedTarget?: Target;
  selectedTargets?: {
    componentId: string;
    target: Target;
  }[];
  day?: Day;
  setOpenAreYouSureModal: SetState<boolean>;
  setSelectedTraining: SetState<TrainingInfo | null>;
  setOpenOverwriteModal?: SetState<boolean>;
  setTrainingInPeriodForModal?: SetState<TrainingInfo | null>;
  addTrainingComponent: (
    trainingId: string,
    data: AddTrainingComponents
  ) => void;
  deleteTrainingComponent: (
    trainingId: string,
    componentId: string
  ) => Promise<void>;
}

export default function TrainingWeekDates(props: TrainingWeekDatesProps) {
  const router = useRouter();
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { components, exercises: allExercises, methods } = useMain();
  const { group, cycle, trainings, setCycle, setTrainings } = useGroup();

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
    day,
    setOpenAreYouSureModal,
    setSelectedTraining,
    setOpenOverwriteModal,
    setTrainingInPeriodForModal,
    addTrainingComponent,
    deleteTrainingComponent,
  } = props;

  return week.map((date, j) => (
    <Box
      key={j}
      width="calc(100% / 7)"
      sx={{
        backgroundColor:
          cycle &&
          dayjs(cycle.from).isBefore(date.endOf('day')) &&
          dayjs(cycle.to).isAfter(date.endOf('day'))
            ? theme.palette.background.default
            : theme.palette.background.paper,
        cursor:
          components.length &&
          cycle &&
          CommonService.instance.date.isBetween(date, cycle.from, cycle.to)
            ? 'pointer'
            : 'default',
      }}
    >
      <Divider />

      {['AM', 'PM'].map((period) => {
        const dateString = dayjs(date).format('D. M.');

        return (
          <React.Fragment key={period}>
            {period === 'PM' && <Divider />}
            <Box
              key={period}
              sx={{
                position: 'relative',
                minHeight: '70px',
                borderRight:
                  j < 6 ? `2px solid ${theme.palette.background.dark}` : 'none',
              }}
              onClick={() => {
                handleClickDateCell(
                  { date, period },
                  {
                    router,
                    group,
                    cycle,
                    componentCalendarView,
                    periodizationView,
                    copyComponent,
                    trainingComponent,
                    training,
                    trainings,
                    components,
                    allExercises,
                    methods,
                    selected,
                    selectedTargets,
                    day,
                    setTrainings,
                    setCycle,
                    setOpenOverwriteModal,
                    setTrainingInPeriodForModal,
                  }
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
                  }}
                >
                  {dateString}
                </Typography>
              )}

              {/* Trainings */}
              {getFilteredTrainings(
                { date },
                {
                  periodizationView,
                  trainingComponent,
                  trainings,
                  selectedTrainings,
                  date,
                  selected,
                  period,
                }
              ).map((training_, key) => {
                return (
                  <Box
                    key={key}
                    borderRadius={
                      componentCalendarView || periodizationView ? 0 : 2
                    }
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
                        !CommonService.instance.date.isBetween(
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
                        training_.components[training_.components.length - 1].to
                      );

                      addTrainingComponent(training_.id, {
                        components: props.selected?.map((c, i) => ({
                          id: c.id,
                          subgroups: [],
                          supersets: [],
                          completedMembersIds: [],
                          from: addMinutes(lastTo, i * 30),
                          to: addMinutes(addMinutes(lastTo, i * 30), 30),
                        })),
                      });
                    }}
                  >
                    {key > 0 && <Divider />}

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
            {period === 'PM' && (
              <>
                <Divider />
                <Divider />
              </>
            )}
          </React.Fragment>
        );
      })}
    </Box>
  ));
}
