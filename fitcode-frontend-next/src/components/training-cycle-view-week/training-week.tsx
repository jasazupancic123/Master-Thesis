import { CommonService } from '@/common/service/common.service';
import { TrainingGridItem } from '@/components/training-cycle-view-week/training-cycle-view-grid-item';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { Divider } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import React from 'react';
import { handleCreateTraining } from '../trainer-cycle-view/state';
import { TrainingCycleViewWeekProps } from './type';

export default function TrainingWeek(props: TrainingCycleViewWeekProps) {
  const { index, week, selected } = props;

  const router = useRouter();
  const screenSize = useScreenSize();
  const {
    token,
    group,
    cycle,
    components,
    setCycle,
    setFilteredTrainings,
    filteredTrainings,
    setTrainings,
  } = useGroup();

  function getFilteredTrainings(date: Dayjs, period: string) {
    date = dayjs(date);

    return filteredTrainings.filter((training) => {
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

  async function handleAddTraining(date: Dayjs, period: 'AM' | 'PM') {
    handleCreateTraining(
      token,
      {
        group,
        cycle: cycle!,
        date,
        period,
        selectedComponents: selected!,
      },
      {
        router,
        setCycle,
        filteredTrainings,
        setFilteredTrainings,
        setTrainings,
        components,
      }
    );
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
            cursor: components.length ? 'pointer' : 'default',
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }}
        >
          {/* Extra column to display the week number */}
          <Typography
            color="#1A2B3C"
            bgcolor="#1EB980"
            p={screenSize.isMobile ? 0.1 : 2}
            sx={{
              backgroundColor: '#1EB980',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              borderBottomRightRadius: 8,
              borderTopRightRadius: 8,
            }}
          >
            Week {index + 1}
          </Typography>

          {week.map((date, j) => (
            <Box
              key={j}
              width="calc(100% / 7)"
              sx={{
                border: '1px solid',
                borderColor: '#303E4A',
                backgroundColor: '#1A2B3C',
                cursor: components.length ? 'pointer' : 'default',
                minHeight: screenSize.isMobile ? 160 : 140,
              }}
            >
              <Typography
                sx={{
                  color: '#fff',
                  fontSize: '0.7rem',
                  opacity: 0.7,
                  height: screenSize.isMobile ? '25%' : '12%',
                }}
              >
                {dayjs(date).format('ddd, DD.MM')}
              </Typography>

              <Divider />

              {['AM', 'PM'].map((period) => (
                <React.Fragment key={period}>
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
                      height: screenSize.isMobile ? '37.5%' : '44%',
                    }}
                    onClick={() =>
                      handleAddTraining(date, period as 'AM' | 'PM')
                    }
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
                        sx={{ cursor: 'pointer', p: 0, m: 0, height: '100%' }}
                        onClick={(e) => {
                          if (!props.selected) return;
                          e.stopPropagation();

                          props.addTrainingComponent(training.id, {
                            componentsIds: props.selected?.map((c) => c.id),
                          });
                        }}
                      >
                        {key > 0 && <Divider />}

                        <TrainingGridItem
                          order={key + 1}
                          training={training}
                          addTrainingComponent={props.addTrainingComponent}
                          deleteTrainingComponent={
                            props.deleteTrainingComponent
                          }
                        />
                      </Box>
                    ))}
                  </Box>
                </React.Fragment>
              ))}
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
