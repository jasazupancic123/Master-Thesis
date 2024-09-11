import dayjs, { Dayjs } from 'dayjs';
import { Training } from '@/training/entity/training.entity';
import { CreateTraining } from '@/training/type/training.type';
import { Component } from '@/component/entity/component.entity';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import React from 'react';
import { CreateTrainingComponent } from '@/training/type/training-component.type';
import { CommonService } from '@/common/service/common.service';
import { TrainingGridItem } from '@/app/groups/components/training-cycle-view-grid-item';

export default function TrainingWeek(props: {
  index: number,
  week: Dayjs[],
  trainings: Training[],
  components: Component[],
  training: Pick<CreateTraining, 'from' | 'to'> & { date: Dayjs },
  addTraining: (data: Pick<CreateTraining, 'from' | 'to'> & { date: Dayjs }) => void,
  addTrainingComponent: (trainingId: string, data: CreateTrainingComponent[]) => void,
  // deleteTraining: (trainingId: string) => Promise<void>,
}) {
  function getFilteredTrainings(date: Dayjs) {
    date = dayjs(date);

    return props.trainings.map(training => {
      const start = dayjs(training.from).startOf('day');
      const end = dayjs(training.to).endOf('day');
      if (CommonService.instance.date.isBetween(date, start, end))
        return training;

      return null;
    });
  }

  return <Box>
    <Box>
      {/* Render days of the week */}
      <Stack
        direction="row"
        p={2}
        sx={{
          padding: '0px',
          textAlign: 'center',
          border: '1px solid',
          borderColor: '#303E4A',
          backgroundColor: '#1A2B3C',
          height: '100%',
          cursor: props.components.length ? 'pointer' : 'default',
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
        }}>
        {/* Extra column to display the week number */}
        <Typography
          color="#1A2B3C"
          bgcolor="#1EB980"
          p={2}
          sx={{
            backgroundColor: '#1EB980',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            borderBottomRightRadius: 8,
            borderTopRightRadius: 8,
          }}
        >
          Week {props.index + 1}
        </Typography>

        {props.week.map((date, j) => (
          <Box
            key={j}
            width="calc(100% / 7)"
            sx={{
              border: '1px solid',
              borderColor: '#303E4A',
              backgroundColor: '#1A2B3C',
              cursor: props.components.length ? 'pointer' : 'default',
            }}
            onClick={async () => {
              if (props.components.length)
                props.addTraining({
                  ...props.training,
                  date: dayjs(date) as Dayjs,
                });
            }}
          >
            <Typography sx={{ color: '#fff', fontSize: '0.7rem', opacity: 0.7 }}>
              {CommonService.instance.date.format(date)}
            </Typography>

            {/* Full-width divider */}
            <Divider />

            <Box>
              {getFilteredTrainings(date).map((training, key) => (
                !training ? null :
                  <Box key={key} borderRadius={2} p={1}>
                    <TrainingGridItem
                      order={key + 1}
                      training={training}
                      components={props.components}
                      addTrainingComponent={props.addTrainingComponent}
                    />
                  </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  </Box>;
}