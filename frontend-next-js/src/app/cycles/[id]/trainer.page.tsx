'use client';

import { PageProps } from '@/app/cycles/[id]/page-props.type';
import Box from '@mui/material/Box';
import IconTextfield from '@/component/icon-textfield';
import { AppContextType, useAppContext } from '@/context/app-provider';
import ExerciseChips from '@/component/exercise-chips';
import { useState } from 'react';
import { Component } from '@/type/component.type';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import { formatDate } from '@/util/date';

export default function TrainerPage(props: PageProps) {
  // context
  const { cycle } = props;
  const { group, weeks } = cycle;
  const { components } = useAppContext() as AppContextType;

  // exercise component
  const [component, setComponent] = useState<Component>(null);

  if (!group || !weeks)
    return null;

  return (
    <Box>
      <Box p={2}>
        <IconTextfield
          value={group.name}
          variant="filled"
          disabled
        />

        <Box display="flex" justifyContent="center" my={5}>
          <ExerciseChips
            selected={component}
            components={components.tree}
            onClick={(component) => setComponent(component)}
          />
        </Box>
      </Box>

      <Box p={2} borderRadius={5} borderColor="primary.main" border={1}>
        {/* Cycle name and weeks count */}
        <Stack direction="row" spacing={5}>
          <Typography variant="h6" color="primary" fontWeight="bold">
            {cycle.name}
          </Typography>

          <Typography variant="body1" fontSize={20}>
            {weeks.length} weeks
          </Typography>
        </Stack>

        {/* Weeks */}
        <Grid container spacing={2} mt={2}>
          {/* Vertical text for week number */}
          <Grid xs={2}>
            {weeks.map((week, i) => (
              <Box display="flex" alignItems="center">
                <Typography
                  key={i}
                  variant="body1"
                  sx={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    textAlign: 'center',
                    lineHeight: 1.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Week {i + 1}
                </Typography>

                {/* 7 days of trainings for each week */}
                <Box display="flex">
                  {week.map(({ date, trainings }, j) => (
                    <Box key={j} display="flex" flexDirection="column">
                      <Typography variant="body1" fontWeight="bold">
                        {formatDate(date)}
                      </Typography>

                      <Box>
                        Trainings
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}