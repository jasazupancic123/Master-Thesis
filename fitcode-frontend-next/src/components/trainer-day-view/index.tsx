import { GroupContextProps } from '@/app/groups/[group_id]/props';
import { CommonService } from '@/common/service/common.service';
import { Day } from '@/common/service/util/date.util';
import Circles from '@/components/circles';
import { TrainingController } from '@/controller/training/training.controller';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Training } from '@/controller/training/type/training.type';
import { TextField, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import MyModal from '../modal';
import { filterExercises } from './state';
import TrainingCard from './training-card';
import TrainingMembers from './training-members';
import { AddSubgroupInput, FilteredExercises } from './type';

const commonService = CommonService.instance;

export default function TrainerDayView(props: GroupContextProps) {
  const {
    token,
    components,
    users,
    selectedCycle,
    selectedTraining,
    setSelectedTraining,
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

  const [openComponent, setOpenComponent] = useState<{
    componentId: string | null;
    trainingId: string | null;
  }>({ componentId: null, trainingId: null });

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

  useEffect(() => {}, [openComponent]);

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
          trainings={todaysTrainings}
          group={props.group}
          users={users}
          selectedTrainingId={openComponent.trainingId}
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
                setSelectedTraining={setSelectedTraining}
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
                openComponent={openComponent}
                setOpenComponent={setOpenComponent}
              />
            )}

            {pmTraining && (
              <TrainingCard
                token={token}
                setSelectedTrainings={setSelectedTrainings}
                selectedTraining={selectedTraining}
                setSelectedTraining={setSelectedTraining}
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
                openComponent={openComponent}
                setOpenComponent={setOpenComponent}
              />
            )}
          </>
        )}
      </Box>
    </>
  );
}
