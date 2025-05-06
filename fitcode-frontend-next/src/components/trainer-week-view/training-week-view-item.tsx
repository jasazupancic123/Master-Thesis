'use client';

import { useGroup } from '@/context/group-provider';
import { Save } from '@mui/icons-material';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { TrainingWeekViewItemProps } from './type';
import { useTheme } from '@mui/material';
import TrainerWeekComponentItem from './training-week-component-item';

export default function TrainingItem(props: TrainingWeekViewItemProps) {
  const { training, updateTraining } = props;
  const theme = useTheme();
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
        <TrainerWeekComponentItem
          key={'warmup'}
          component={training.warmup}
          training={training}
          setIsChanged={setIsChanged}
          updatedComponents={updatedComponents}
          setUpdatedComponents={setUpdatedComponents}
          warmupOrCooldown="warmup"
        />
        {training.components.map((c) => (
          <TrainerWeekComponentItem
            key={c.id}
            component={c}
            training={training}
            setIsChanged={setIsChanged}
            updatedComponents={updatedComponents}
            setUpdatedComponents={setUpdatedComponents}
          />
        ))}
        <TrainerWeekComponentItem
          key={'cooldown'}
          component={training.cooldown}
          training={training}
          setIsChanged={setIsChanged}
          updatedComponents={updatedComponents}
          setUpdatedComponents={setUpdatedComponents}
          warmupOrCooldown="cooldown"
        />
      </Box>
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
    </Box>
  );
}
