'use client';

import { GroupContextProps } from '@/app/groups/[group_id]/props';
import { CommonService } from '@/common/service/common.service';
import Circles from '@/components/circles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import React, { Fragment, useEffect, useState } from 'react';
import { getWeek, updateTraining } from './state';
import TrainingItem from './training-week-view-item';

const commonService = CommonService.instance;

export default function TrainerWeekView(props: GroupContextProps) {
  const { token, components, trainings, selectedCycle, setSelectedTrainings } =
    props;

  const [index, setIndex] = useState(0); // week index
  const weeks = selectedCycle?.weeks || [];

  /**
   * Set date to cycle start and end when opening the page
   */
  useEffect(() => {
    if (!selectedCycle) return;
    setIndex(0);
  }, [selectedCycle?.id]);

  if (!selectedCycle) return null;

  return (
    <Box
      sx={{
        backgroundColor: '#1A2B3C',
        padding: '12px',
        pb: '20px',
        borderRadius: '8px',
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
          items={weeks.map((_: any, i: number) => ({
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
          {getWeek(weeks, index)?.map(({ date }: { date: Date }, i: number) => {
            const day = dayjs(date);
            const filtered = trainings.filter((t: any) =>
              commonService.date.isBetween(day, dayjs(t.from), dayjs(t.to))
            );

            return (
              <Grid
                key={i}
                size={{ xs: 12 / 7 }}
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
                  {filtered.map((training: any) => (
                    <Fragment key={training.id}>
                      <TrainingItem
                        training={training}
                        updateTraining={(training, input) =>
                          updateTraining(
                            token,
                            training,
                            input,
                            selectedCycle,
                            setSelectedTrainings,
                            components
                          )
                        }
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
