'use client';

import Grid2 from '@mui/material/Unstable_Grid2';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { ArrowCircleRight } from '@mui/icons-material';
import React from 'react';
import YearDateRangeSlider from '@/common/components/year-date-range-slider';
import Stack from '@mui/material/Stack';
import { GroupPageProps } from '@/group/type/props.type';
import { CommonService } from '@/common/service/common.service';

export default function TrainerYearView(props: GroupPageProps) {
  const group = props.selected.group;
  if (!group)
    return <Typography variant="body1" mt={2}>No group selected</Typography>;

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
      {group.cycles.map(cycle => (
        <Stack direction="row" key={cycle.id} spacing={2}>
          <Typography variant="caption">
            {cycle.name}
          </Typography>

          <YearDateRangeSlider date={[dayjs(cycle.from), dayjs(cycle.to)]} />
        </Stack>
      ))}
    </Stack>

    {/*
     - If group is selected and cycle is not, show all group cycles
     - If cycle is selected, show cycle start and end date
     */}
    {props.selected.group && !props.selected.cycle ? <>
      <Grid2 container spacing={1}>
        {group.cycles.map((cycle) => (
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
                {CommonService.instance.date.format(dayjs(cycle.from))}
                <ArrowCircleRight sx={{ mx: 1 }} />
                {CommonService.instance.date.format(dayjs(cycle.to))}
              </Typography>

              <Typography variant="body2">
                {cycle.trainings?.length || 0} trainings
              </Typography>
            </Box>
          </Grid2>
        ))}
      </Grid2>
    </> : props.selected.cycle ? <Stack direction="row" m={1}>
      <Typography variant="h6" m={1}>
        {CommonService.instance.date.format(dayjs(props.selected.cycle.from))}
      </Typography>

      <Typography variant="h6" m={1}>
        -
      </Typography>

      <Typography variant="h6" m={1}>
        {CommonService.instance.date.format(dayjs(props.selected.cycle.to))}
      </Typography>
    </Stack> : null}
  </>;
}