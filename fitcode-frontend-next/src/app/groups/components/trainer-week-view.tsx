import React, { Fragment, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Training } from '@/training/entity/training.entity';
import Stack from '@mui/material/Stack';
import Circles from '@/app/groups/components/circles';
import { GroupPageProps } from '@/group/type/props.type';
import { CommonService } from '@/common/service/common.service';
import { TrainingController } from '@/training/training.controller';
import { useAppContext } from '@/context/app-provider';
import { UpdateTraining } from '@/training/type/training.type';
import toast from 'react-hot-toast';
import Warning from '@/common/components/warning';

const commonService = CommonService.instance;

export default function TrainerWeekView(props: GroupPageProps) {
  const { token } = useAppContext();
  const [index, setIndex] = useState(0); // week index
  const cycle = props.selected.cycle;
  const weeks = cycle?.weeks || [commonService.date.getWeekDays()];
  const trainings = cycle?.trainings || [];

  const getWeek = (index: number) => weeks[index];
  const getWeekStart = (index: number) =>
    dayjs(weeks[index][0].date)!.startOf('day');
  const getWeekEnd = (index: number) =>
    dayjs(weeks[index][6].date)!.endOf('day');

  async function updateTraining(training: Training, input: UpdateTraining) {
    if (!cycle) return;
    if (!Object.keys(input).length) return;

    try {
      const updated = await TrainingController.updateTraining(
        token,
        training.id,
        input
      );

      // update trainings state
      props.setSelected((prev) => ({
        ...prev,
        cycle: {
          ...prev.cycle!,
          trainings: (prev.cycle!.trainings || []).map((t) =>
            t.id === updated.id ? updated : t
          ),
        },
      }));
    } catch (e: any) {
      toast.error(e.message || 'Error updating training');
    }
  }

  /**
   * Set date to cycle start and end when opening the page
   */
  useEffect(() => {
    if (!cycle) return;
    setIndex(0);
  }, [cycle?.id]);

  /**
   * Set date range when week index changes
   */
  useEffect(() => {
    props.setDate({
      start: getWeekStart(index),
      end: getWeekEnd(index),
      custom: index !== 0,
    });
  }, [index]);

  if (!cycle) return <Warning title="Select cycle" topBorder />;

  return (
    <Box
      sx={{
        backgroundColor: '#1A2B3C', // Set a consistent background color
        padding: '12px',
        pb: '20px',
        borderRadius: '8px', // Optional: can add more style based on the overall design
      }}
    >
      {/* Week selector */}
      <Box
        sx={{ padding: '0', backgroundColor: 'inherit', marginBottom: '20px' }}
      >
        <Circles
          arrows
          onArrowClick={(direction) => {
            if (
              (direction === 'left' && index === 0) ||
              (direction === 'right' && index === weeks.length - 1)
            )
              return;

            setIndex((prev) => (direction === 'left' ? prev - 1 : prev + 1));
          }}
          items={weeks.map((_, i) => ({
            label: `W${i + 1}`,
            value: i.toString(),
          }))}
          value={index.toString()}
          setValue={(value) => setIndex(parseInt(value))}
        />
      </Box>

      {/* Trainings */}
      <Box pt={4} px={1}>
        <Grid
          container
          spacing={2}
          display="flex"
          justifyContent="space-between"
        >
          {getWeek(index)?.map(({ date }, i) => {
            const day = dayjs(date);
            const filtered = trainings.filter((t) =>
              commonService.date.isBetween(day, dayjs(t.from), dayjs(t.to))
            );

            return (
              <Grid
                key={i}
                xs={12 / 7}
                sx={{
                  padding: '8px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography sx={{ color: '#fff' }}>
                  {commonService.date.format(day)}
                </Typography>

                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {filtered.map((training) => (
                    <Fragment key={training.id}>
                      <TrainingItem
                        training={training}
                        updateTraining={updateTraining}
                      />
                    </Fragment>
                  ))}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
}

function TrainingItem(props: {
  training: Training;
  updateTraining: (training: Training, input: UpdateTraining) => Promise<void>;
}) {
  const { training, updateTraining } = props;
  const [date, setDate] = useState(() => ({
    from: dayjs(training.from).format('HH:mm'),
    to: dayjs(training.to).format('HH:mm'),
  }));

  async function onChange(key: 'from' | 'to', value: string) {
    const [hours, minutes] = value.split(':');
    const date = dayjs(training.from)
      .set('hour', parseInt(hours))
      .set('minute', parseInt(minutes));
    await updateTraining(training, { [key]: date.toDate() });
    setDate((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Box>
      {/* Training components */}
      <Box
        sx={{
          flex: 1,
          p: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack spacing={1}>
          <input
            type="time"
            value={date.from}
            onChange={(e) => onChange('from', e.target.value)}
            style={{
              color: '#fff',
              backgroundColor: '#303E4A',
              border: 'none',
              padding: '4px',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          />

          <input
            type="time"
            value={date.to}
            onChange={(e) => onChange('to', e.target.value)}
            style={{
              color: '#fff',
              backgroundColor: '#303E4A',
              border: 'none',
              padding: '4px',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          />
        </Stack>

        {training.components.map((c) => (
          <Box
            key={c.id}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
            }}
          >
            <Typography
              sx={{ color: '#fff', textAlign: 'left', flexBasis: '66.67%' }}
            >
              {c.component?.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
