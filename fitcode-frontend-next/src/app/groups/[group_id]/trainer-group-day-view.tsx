import { CommonService } from '@/common/service/common.service';
import { Day } from '@/common/service/util/date.util';
import { handleApiRequest } from '@/common/type/state.type';
import Circles from '@/components/circles';
import TrainingCard from '@/components/trainer-day-view/training-card';
import TrainingMembers from '@/components/trainer-day-view/training-members';
import { useGroup } from '@/context/group-provider';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { Training } from '@/controller/training/type/training.type';
import { Save } from '@mui/icons-material';
import { Fab, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const commonService = CommonService.instance;

export default function TrainerDayView() {
  const {
    token,
    cycle,
    filteredTrainings,
    training,
    setDateFrom,
    setDateTo,
    components,
    setTrainings,
    setFilteredTrainings,
  } = useGroup();

  const router = useRouter();
  const [day, setDay] = useState<Day>(commonService.date.getToday());
  const [days, setDays] = useState(
    commonService.date.getWeekDays().map(({ label, date }) => ({
      label: label[0],
      value: date.toString(),
      sublabel: commonService.date.format(date, { withYear: false }),
    }))
  );

  useEffect(() => {
    setDateFrom(day.date.startOf('day'));
    setDateTo(day.date.endOf('day'));
  }, [day]);

  const todaysTrainings = filteredTrainings.filter((t) =>
    commonService.date.isSameDay(day.date, dayjs(t.from))
  );

  const amTraining = todaysTrainings.find((t) => dayjs(t.from).hour() < 12);
  const pmTraining = todaysTrainings.find((t) => dayjs(t.from).hour() >= 12);

  if (!cycle) return <>Select cycle</>;

  // console.log('training:', training);

  async function handleUpdateTraining() {
    if (!training) return;

    await handleApiRequest(
      router,
      () => TrainingController.update(token, training.id, training),
      (newTraining) => {
        const mapped = TrainingService.mapComponents(newTraining, components);

        setTrainings((prev) =>
          prev.map((t) => (t.id === newTraining.id ? mapped : t))
        );

        setFilteredTrainings((prev) =>
          prev.map((t) => (t.id === newTraining.id ? mapped : t))
        );

        toast.success('Training updated successfully');
      },
      undefined,
      'Error when updating training'
    );
  }

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
            setDateFrom(dayjs(value).startOf('day'));
            setDateTo(dayjs(value).endOf('day'));
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
            setDateFrom(newDay.startOf('day'));
            setDateTo(newDay.endOf('day'));
            setDays(
              commonService.date.getWeekDays(newDay).map(({ label, date }) => ({
                label: label[0],
                value: date.toString(),
                sublabel: commonService.date.format(date, { withYear: false }),
              }))
            );
          }}
        />

        <TrainingMembers />
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
              <>
                {training && training?.id === amTraining.id && (
                  <Fab
                    size="small"
                    color="secondary"
                    aria-label="add"
                    onClick={() => {
                      handleUpdateTraining();
                    }}
                  >
                    <Save />
                  </Fab>
                )}

                <TrainingCard day={day} training={amTraining} period="AM" />
              </>
            )}

            {pmTraining && (
              <>
                {training && training?.id === pmTraining.id && (
                  <Fab
                    size="small"
                    color="secondary"
                    aria-label="add"
                    onClick={() => {
                      handleUpdateTraining();
                    }}
                  >
                    <Save />
                  </Fab>
                )}

                <TrainingCard day={day} training={pmTraining} period="PM" />
              </>
            )}
          </>
        )}
      </Box>
    </>
  );
}
