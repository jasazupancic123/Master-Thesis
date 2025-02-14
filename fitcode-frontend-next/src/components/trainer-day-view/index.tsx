import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Circles from '@/components/circles';
import dayjs from 'dayjs';
import { TextField, Typography } from '@mui/material';
import { CommonService } from '@/common/service/common.service';
import { Day } from '@/common/service/util/date.util';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { FilterTypeViewProps } from '@/app/groups/[group_id]/type';
import TrainingMembers from './training-members';
import { AddSubgroupInput, FilteredExercises } from './type';
import { filterExercises } from './state';
import MyModal from '../modal';
import { TrainingController } from '@/controller/training/training.controller';
import TrainingCard from './training-card';

const commonService = CommonService.instance;

export default function TrainerDayView(props: FilterTypeViewProps) {
  const {
    token,
    components,
    users,
    selectedCycle,
    selectedTraining,
    trainings,
    setSelectedTrainings,
    exercises,
    setDate,
  } = props;

  const [day, setDay] = useState<Day>(commonService.date.getToday());
  const [days, setDays] = useState(
    commonService.date.getWeekDays().map(({ label, date }) => ({
      label: label[0],
      value: date.toString(),
      sublabel: commonService.date.format(date, { withYear: false }),
    }))
  );

  const todaysTrainings = trainings.filter((training) =>
    commonService.date.isSameDay(day.date, dayjs(training.from))
  );

  const amTraining = todaysTrainings.find(
    (training) => dayjs(training.from).hour() < 12
  );

  const pmTraining = todaysTrainings.find(
    (training) => dayjs(training.from).hour() >= 12
  );

  const [selectedDailyTraining, setSelectedDailyTraining] = useState<{
    am: boolean;
    pm: boolean;
  }>({ am: !pmTraining ? true : false, pm: !amTraining ? true : false });

  const [filteredExercises, setFilteredExercises] = useState<FilteredExercises>(
    {
      show: false,
      componentId: null,
      superset: 0,
      search: { name: '' },
      pagination: { page: 1, pageSize: 9, pages: 1, total: 0 },
      data: [],
    }
  );

  /**
   * Filter exercises
   */
  useEffect(() => {
    if (!filteredExercises.show || !filteredExercises.componentId) return;

    filterExercises(
      filteredExercises,
      exercises,
      components,
      setFilteredExercises
    );
  }, [
    token,
    filteredExercises.show,
    filteredExercises.componentId,
    filteredExercises.search.name,
    filteredExercises.pagination.page,
    filteredExercises.pagination.pageSize,
  ]);

  if (!selectedCycle) return <>Select cycle!</>;

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        sx={{
          borderBottomRightRadius: todaysTrainings.length === 0 ? 0 : '20px',
          borderBottomLeftRadius: todaysTrainings.length === 0 ? 0 : '20px',
          bgcolor: 'background.paper',
        }}
      >
        <Circles
          items={days}
          value={day.date.toString()}
          setValue={(value) => {
            setDay({ label: '', date: dayjs(value) });
            setDate({
              start: dayjs(value).startOf('day'),
              end: dayjs(value).endOf('day'),
              custom: true,
            });
          }}
          getBackgroundColor={(value, itemValue) =>
            commonService.date.isSameDay(dayjs(value), dayjs(itemValue))
              ? '#1EB980'
              : 'rgba(255, 255, 255, 0.1)'
          }
          sx={{
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
            marginBottom: 3,
          }}
          arrows
          onArrowClick={(direction) => {
            const newDay =
              direction === 'left'
                ? day.date.subtract(1, 'day')
                : day.date.add(1, 'day');

            setDay({ label: '', date: newDay });
            setDate({
              start: newDay.startOf('day'),
              end: newDay.endOf('day'),
              custom: true,
            });

            setDays(
              commonService.date.getWeekDays(newDay).map(({ label, date }) => ({
                label: label[0],
                value: date.toString(),
                sublabel: commonService.date.format(date, { withYear: false }),
              }))
            );
          }}
        />

        <TrainingMembers
          training={props.selectedTraining}
          group={props.group}
          users={users}
        />
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        mt={todaysTrainings.length === 0 ? 0 : 2}
        pb={15}
        sx={{
          borderBottomRightRadius: '20px',
          borderBottomLeftRadius: '20px',
        }}
      >
        {/* Training set groups with set exercises */}
        {todaysTrainings.length === 0 ? (
          <Box
            display="flex"
            bgcolor={'background.paper'}
            width="100%"
            p={2}
            justifyContent="center"
            sx={{
              borderBottomRightRadius: '20px',
              borderBottomLeftRadius: '20px',
            }}
          >
            <Typography variant="h6" mb={2}>
              No session for current date
            </Typography>
          </Box>
        ) : (
          <>
            {amTraining && (
              <TrainingCard
                token={token}
                setSelectedTrainings={setSelectedTrainings}
                selectedTraining={selectedTraining}
                users={users}
                filteredExercises={filteredExercises}
                setFilteredExercises={setFilteredExercises}
                components={components}
                training={amTraining}
                period="AM"
                exercises={exercises}
                day={day}
                selectedDailyTraining={selectedDailyTraining}
                setSelectedDailyTraining={setSelectedDailyTraining}
              />
            )}

            {pmTraining && (
              <TrainingCard
                token={token}
                setSelectedTrainings={setSelectedTrainings}
                selectedTraining={selectedTraining}
                users={users}
                filteredExercises={filteredExercises}
                setFilteredExercises={setFilteredExercises}
                components={components}
                training={pmTraining}
                period="PM"
                exercises={exercises}
                day={day}
                selectedDailyTraining={selectedDailyTraining}
                setSelectedDailyTraining={setSelectedDailyTraining}
              />
            )}
          </>
        )}
      </Box>
    </>
  );
}
