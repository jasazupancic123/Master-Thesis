'use client';

import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import React, { Fragment, useEffect, useState } from 'react';

import { CommonService } from '@/common/service/common.service';
import Circles from '@/components/circles/circles';
import TrainingItem from '@/components/training-week-view-item/training-week-view-item';
import type { Week } from '@/controller/group/type/cycle.type';
import type {
  Training,
  TrainingInfo,
} from '@/controller/training/type/training.type';
import { useGroup } from '@/store/group-provider';

const commonService = CommonService.instance;

export default function TrainerWeekView() {
  const theme = useTheme();

  const { cycle, trainings, setDateFrom, setDateTo } = useGroup();

  const [index, setIndex] = useState(0); // week index
  const weeks = commonService.date.weeks(cycle?.from, cycle?.to) || [];

  /**
   * Set date to cycle start and end when opening the page
   */
  useEffect(() => {
    if (!cycle) return;
    setIndex(0);
  }, [cycle]);

  /**
   * Filter trainings based on cycle
   */
  useEffect(() => {
    if (!cycle) return;
    setDateFrom(dayjs(weeks[index][0].date));
    setDateTo(dayjs(weeks[index][6].date));
  }, [cycle, index]);

  if (!cycle) return null;

  return (
    <Box
      minHeight={195}
      sx={{
        backgroundColor: theme.palette.background.paper,
        padding: '12px',
        pb: '20px',
        borderRadius: '8px',
        borderTopLeftRadius: '0',
        borderTopRightRadius: '0',
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
          items={weeks.map((_: Week[], i: number) => ({
            label: `W${i + 1}`,
            value: i.toString(),
          }))}
          value={index.toString()}
          setValue={(value) => setIndex(parseInt(value))}
        />
      </Box>

      {/* Trainings */}
      <Box pt={0} px={1}>
        <Grid
          container
          spacing={2}
          display="flex"
          justifyContent="space-between"
        >
          {weeks[index].map(({ date }, i) => {
            const day = dayjs(date);
            const filtered = trainings.filter((t) =>
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
                <Typography>
                  {commonService.date.format(day, {
                    withYear: false,
                    withMonth: true,
                    withoutDots: false,
                  })}
                </Typography>

                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {filtered.map((training: TrainingInfo) => (
                    <Fragment key={training.id}>
                      <TrainingItem training={training as Training} />
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
