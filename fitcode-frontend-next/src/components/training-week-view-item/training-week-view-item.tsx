'use client';

import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

import TrainerWeekComponentItem from '../training-week-component-item/training-week-component-item';
import type { Training } from '@/controller/training/type/training.type';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';

export type TrainingWeekViewItemProps = {
  training: Training;
};

export default function TrainingItem(props: TrainingWeekViewItemProps) {
  const screenSize = useScreenSize();

  const { training } = props;
  const { setTrainings } = useGroup();

  const [updatedComponents] = useState(training.components);

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
          p: screenSize.isMobile || screenSize.isSmallTablet ? 0 : 1,
          mt: screenSize.isMobile || screenSize.isSmallTablet ? 0.5 : undefined,
          display: 'flex',
          flexDirection: 'column',
          alignItems:
            screenSize.isMobile || screenSize.isSmallTablet
              ? 'center'
              : undefined,
        }}
        gap={1}
      >
        {training.components.map((c) => (
          <TrainerWeekComponentItem key={c.id} component={c} />
        ))}
      </Box>
    </Box>
  );
}
