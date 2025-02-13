import dayjs, { Dayjs } from 'dayjs';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import React from 'react';
import { CommonService } from '@/common/service/common.service';
import { TrainingGridItem } from '@/components/training-cycle-view-week/training-cycle-view-grid-item';
import { TrainingCycleViewWeekProps } from './type';
import { handleCreateTraining } from '../trainer-cycle-view/state';
import { Component } from '@/controller/component/type/component.type';

export default function TrainingWeek(props: TrainingCycleViewWeekProps) {
  function getFilteredTrainings(date: Dayjs, period: string) {
    date = dayjs(date);

    return props.trainings.filter((training) => {
      const trainingDate = dayjs(training.from);
      const start = trainingDate.startOf('day');
      const end = dayjs(training.to).endOf('day');

      // Check if training falls within the given day
      const isBetween = CommonService.instance.date.isBetween(date, start, end);
      if (!isBetween) return false;

      // Apply AM/PM filtering
      if (period === 'AM') return trainingDate.hour() < 12; // Before noon
      if (period === 'PM') return trainingDate.hour() >= 12; // Noon or later

      return false;
    });
  }

  const handleAddTraining = async (date: Dayjs, period: 'AM' | 'PM') => {
    if (props.components.length) {
      console.log('period inside handleAddTraining', period);
      await handleCreateTraining(
        props.token,
        { ...props.training, date },
        period,
        props.group,
        props.setSelectedTrainings,
        props.selectedCycle,
        props.selected as Component[],
        props.setSelectedComponents,
        props.components,
        props.trainings
      );
    }
  };

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
                minHeight: 140,
              }}
            >
              <Typography
                sx={{
                  color: '#fff',
                  fontSize: '0.7rem',
                  opacity: 0.7,
                  height: '12%',
                }}
              >
                {dayjs(date).format('ddd, DD.MM')}
              </Typography>

              {/* Full-width divider */}
              <Divider />

              {['AM', 'PM'].map((period, index) => (
                <>
                  {period === 'PM' && (
                    <>
                      <Divider />
                      <Divider />
                    </>
                  )}
                  <Box
                    key={period}
                    sx={{
                      position: 'relative',
                      height: '44%',
                    }}
                    onClick={async () => {
                      await handleAddTraining(date, period as 'AM' | 'PM');
                    }}
                  >
                    {/* Period Label */}
                    <Typography
                      sx={{
                        position: 'absolute',
                        top: 4,
                        left: 6,
                        color: '#fff',
                        fontSize: '0.7rem',
                        opacity: 0.7,
                      }}
                    >
                      {period}
                    </Typography>

                    {/* Trainings */}
                    {getFilteredTrainings(date, period).map((training, key) => (
                      <Box
                        key={key}
                        borderRadius={2}
                        sx={{
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          props.addTrainingComponent(training.id, {
                            components: props.components.map((c, i) => ({
                              id: c.id,
                              order: i,
                            })),
                          });
                          props.setSelected!!([]);
                        }}
                      >
                        {key > 0 && <Divider />}
                        <TrainingGridItem
                          order={key + 1}
                          training={training}
                          components={props.components}
                          addTrainingComponent={props.addTrainingComponent}
                          deleteTraining={props.deleteTraining}
                          deleteTrainingComponent={
                            props.deleteTrainingComponent
                          }
                        />
                      </Box>
                    ))}
                  </Box>
                </>
              ))}
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
