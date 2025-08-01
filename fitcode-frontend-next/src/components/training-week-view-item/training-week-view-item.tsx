'use client';

import { useGroup } from '@/store/group-provider';
import { Save } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import TrainerWeekComponentItem from '../training-week-component-item/training-week-component-item';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import {
  Training,
  UpdateTraining,
} from '@/controller/training/type/training.type';

export type TrainingWeekViewItemProps = {
  training: Training;
  updateTraining: (training: Training, input: UpdateTraining) => Promise<void>;
};

export default function TrainingItem(props: TrainingWeekViewItemProps) {
  const { training, updateTraining } = props;
  const { setTrainings } = useGroup();

  const [isChanged, setIsChanged] = useState(false);
  const [updatedComponents, setUpdatedComponents] = useState(
    training.components
  );

  useEffect(() => {
    // only update current filtered trainings (in week view, max 7 of them are in array)
    // and update all trainings and current training after training is saved
    setTrainings((prev) =>
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
        {[training.warmup, ...training.components, training.cooldown].map(
          (c) => (
            <TrainerWeekComponentItem
              key={c.id}
              component={c}
              training={training}
              setIsChanged={setIsChanged}
              updatedComponents={updatedComponents}
              setUpdatedComponents={setUpdatedComponents}
              warmupOrCooldown={
                c.id === WARMUP_ID
                  ? WARMUP_ID
                  : c.id === COOLDOWN_ID
                    ? COOLDOWN_ID
                    : undefined
              }
            />
          )
        )}
      </Box>
      {isChanged && (
        <IconButton
          onClick={() => {
            /* updateTraining(training, {
              from: training.from,
              to: training.to,
              components: updatedComponents,
            }); */

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
