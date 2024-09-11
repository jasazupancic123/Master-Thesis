'use client';

import Grid2 from '@mui/material/Unstable_Grid2';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { formatDate } from '@/common/service/util/date.util';
import dayjs from 'dayjs';
import { ArrowCircleRight } from '@mui/icons-material';
import React, { Fragment } from 'react';
import YearDateRangeSlider from '@/common/components/year-date-range-slider';
import Stack from '@mui/material/Stack';
import { GroupPageProps } from '@/group/type/props.type';

export default function TrainerYearView(props: GroupPageProps) {
  return <>
    <Stack
      direction="column"
      p={3}
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        borderBottomRightRadius: '20px',
        borderBottomLeftRadius: '20px',
        bgcolor: 'background.paper',
      }}
    >
      {props.selected.cycles.map(cycle => (
        <Stack direction="row" key={cycle.id} spacing={2}>
          <Typography variant="caption">
            {cycle.name}
          </Typography>

          <YearDateRangeSlider date={[dayjs(cycle.startDate), dayjs(cycle.endDate)]} />
        </Stack>
      ))}
    </Stack>

    {/*
     - If group is selected and cycle is not, show all group cycles
     - If cycle is selected, show cycle start and end date
     */}
    {props.selected.group && !props.selected.cycle ? <>
      <Grid2 container spacing={1}>
        {props.selected.cycles.map((cycle) => (
          <Grid2 key={cycle.id} xs={12} sm={6} md={4} lg={3}>
            <Box
              sx={{
                padding: 2,
                borderRadius: 1,
                borderColor: '#303E4A',
                borderWidth: 1,
                borderStyle: 'solid',
                cursor: 'pointer',
              }}
              onClick={() => props.setSelected(prev => ({ ...prev, cycle }))}
            >
              <Typography variant="h6" mb={1}>
                {cycle.name}
              </Typography>

              <Typography variant="body2" mb={1}>
                {formatDate(dayjs(cycle.startDate))}
                <ArrowCircleRight sx={{ mx: 1 }} />
                {formatDate(dayjs(cycle.endDate))}
              </Typography>

              <Typography variant="body2">
                {cycle.trainings?.length || 0} trainings
              </Typography>
            </Box>
          </Grid2>
        ))}
      </Grid2>
    </> : props.selected.cycle ? <>
      <Typography variant="h6" mr={2}>
        {formatDate(dayjs(props.selected.cycle!.startDate))}
        <ArrowCircleRight sx={{ mx: 1 }} />
        {formatDate(dayjs(props.selected.cycle!.endDate))}
      </Typography>
    </> : null}
  </>;
}