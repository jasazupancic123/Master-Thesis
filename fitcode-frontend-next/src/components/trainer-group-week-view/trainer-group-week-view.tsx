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
import type { Training } from '@/controller/training/type/training.type';
import { useGroup } from '@/store/group-provider';
import HorizontalItemsList from '../horizontal-items-list/horizontal-items-list';
import { MAX_WIDTH } from '../trainer-day-view/constant';

const commonService = CommonService.instance;

export default function TrainerWeekView() {
  const theme = useTheme();

  const { cycle, trainings, setDateFrom, setDateTo } = useGroup();

  const [index, setIndex] = useState(0); // week index
  const weeks = cycle
    ? commonService.date.weeks(cycle.from, cycle.to)
    : commonService.date.weeks(new Date(), dayjs().add(6, 'day').toDate());

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
    if (weeks.length < 7) return;

    setDateFrom(dayjs(weeks[index][0].date));
    setDateTo(dayjs(weeks[index][6].date));
  }, [cycle, index]);

  return (
    <Box
      width="100%"
      maxWidth={MAX_WIDTH}
      minHeight={195}
      display="flex"
      flexDirection="column"
      gap={2}
      sx={{
        mx: 'auto',
      }}
    >
      {/* Week selector */}
      <Box width="100%" display="flex">
        <Box width="25%" display="flex" />
        <Box width="50%" display="flex" maxHeight={67}>
          <HorizontalItemsList
            items={weeks.map((week: Week[], i: number) => {
              return { label: `WEEK ${i + 1}`, value: i.toString() };
            })}
            noItemsText="No weeks available"
            value={index.toString()}
            setValue={(value) => {
              setIndex(parseInt(value, 10));
            }}
            onArrowClick={() => {}}
            cycleView
            weekView
            checkIsSameValue={(value: string) => {
              return value === index.toString();
            }}
          />
        </Box>
        <Box width="25%" display="flex" justifyContent="flex-end"></Box>
      </Box>

      {/* Trainings */}
      <Box width="100%" display="flex" justifyContent="center">
        {weeks[index]?.map(({ date }, i) => {
          const day = dayjs(date);
          const filtered = trainings.filter((t) =>
            commonService.date.isBetween(day, dayjs(t.from), dayjs(t.to))
          );

          return (
            <Box key={i} width={`${100 / 7}%`}>
              <Typography textAlign="center" fontSize={14}>
                {commonService.date.format(day, {}, 'dddd - D/M')}
              </Typography>

              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {filtered.map((training: Training) => (
                  <Fragment key={training.id}>
                    <TrainingItem training={training as Training} />
                  </Fragment>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
