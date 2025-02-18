'use client';

import { useGroup } from '@/context/group-provider';
import { Save } from '@mui/icons-material';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { TrainingWeekViewItemProps } from './type';

export default function TrainingItem(props: TrainingWeekViewItemProps) {
  const { training, updateTraining } = props;
  const { setFilteredTrainings } = useGroup();

  const [isChanged, setIsChanged] = useState(false);
  const [updatedComponents, setUpdatedComponents] = useState(
    training.components
  );

  useEffect(() => {
    // only update current filtered trainings (in week view, max 7 of them are in array)
    // and update all trainings and current training after training is saved
    setFilteredTrainings((prev) =>
      prev.map((t) =>
        t.id === training.id
          ? { ...training, components: updatedComponents }
          : t
      )
    );
  }, [updatedComponents]);

  return (
    <Box>
      {isChanged && (
        <IconButton
          onClick={() => {
            updateTraining(training, {
              from: training.from,
              to: training.to,
              components: updatedComponents,
            });

            setIsChanged(false);
          }}
        >
          <Tooltip title="Save Training">
            <Save />
          </Tooltip>
        </IconButton>
      )}

      {/* Training components */}
      <Box
        sx={{
          flex: 1,
          p: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {training.components.map((c) => (
          <Stack key={c.id}>
            <Typography
              sx={{
                color: '#fff',
                textAlign: 'left',
                flexBasis: '66.67%',
              }}
            >
              {c.component?.name}
            </Typography>

            <Stack spacing={1} sx={{ mb: 1 }}>
              <input
                type="time"
                value={dayjs(c.from).format('HH:mm')}
                onChange={(e) => {
                  setIsChanged(true);

                  const [hours, minutes] = e.target.value.split(':');
                  const from = dayjs(training.from)
                    .set('hour', parseInt(hours))
                    .set('minute', parseInt(minutes))
                    .toDate();

                  const components = [...updatedComponents];
                  const i = updatedComponents.findIndex((tc) => tc.id === c.id);
                  if (i === -1) return;
                  components[i] = { ...components[i], from };
                  setUpdatedComponents(components);
                }}
                style={{
                  color: '#fff',
                  backgroundColor: '#303E4A',
                  border: 'none',
                  padding: '4px',
                  borderRadius: '4px',
                  textAlign: 'center',
                }}
              />

              {/* <input
                type="time"
                value={date.to}
                onChange={(e) => onChange('to', e.target.value)}
                style={{
                  color: '#fff',
                  backgroundColor: '#303E4A',
                  border: 'none',
                  padding: '4px',
                  borderRadius: '4px',
                  textAlign: 'center',
                }}
              /> */}
            </Stack>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}
