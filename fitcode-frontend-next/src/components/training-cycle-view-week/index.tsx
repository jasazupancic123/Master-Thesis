import dayjs, { Dayjs } from 'dayjs';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import React from 'react';
import { CommonService } from '@/common/service/common.service';
import { TrainingGridItem } from '@/components/training-cycle-view-week/training-cycle-view-grid-item';
import { TrainingCycleViewWeekProps } from './type';

export default function TrainingWeek(props: TrainingCycleViewWeekProps) {
  function getFilteredTrainings(date: Dayjs) {
    date = dayjs(date);

    return props.trainings.map((training) => {
      const start = dayjs(training.from).startOf('day');
      const end = dayjs(training.to).endOf('day');
      if (CommonService.instance.date.isBetween(date, start, end))
        return training;

      return null;
    });
  }

  return (
    <Box>
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
          }}
        >
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
                console.log(date.toDate());
                if (props.components.length)
                  props.addTraining({ ...props.training, date });
              }}
            >
              <Typography
                sx={{ color: '#fff', fontSize: '0.7rem', opacity: 0.7 }}
              >
                {CommonService.instance.date.format(date)}
              </Typography>

              {/* Full-width divider */}
              <Divider />

              <Box>
                {getFilteredTrainings(date).map((training, key) => {
                  return !training ? null : (
                    <Box key={key} borderRadius={2} p={1}>
                      <TrainingGridItem
                        order={key + 1}
                        training={training}
                        components={props.components}
                        addTrainingComponent={props.addTrainingComponent}
                        deleteTraining={props.deleteTraining}
                        deleteTrainingComponent={props.deleteTrainingComponent}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
