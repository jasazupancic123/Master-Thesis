'use client';

import { GroupDateFilter } from '@/common/type/filter.type';
import FilterButton from '@/components/filter-button';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { Box, ToggleButtonGroup } from '@mui/material';
import toast from 'react-hot-toast';
import { GroupDateFilterButtonGroupProps } from './props';

export default function GroupDateFilterButtonGroup(
  props: GroupDateFilterButtonGroupProps
) {
  const { filter, setFilter } = props;
  const screenSize = useScreenSize();
  const { detectedChanges, setDetectedChanges } = useGroup();

  return (
    <Box mx="auto" justifyContent="center">
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, val: GroupDateFilter) => {
          if (detectedChanges) {
            toast.error('Unsaved changes will be lost', {
              icon: '⚠️',
              duration: 1000,
            });

            setDetectedChanges(false);
            return;
          }

          setFilter((prev) => (!val ? prev : val));
        }}
        sx={{
          display: 'flex',
          bgcolor: 'background.default',
          width: screenSize.isMobile
            ? '90%'
            : screenSize.isLandscapeMobile
              ? '90%'
              : '100%',
          maxWidth: 600,
          mx: 'auto',
          borderBottomLeftRadius: '500px',
          borderBottomRightRadius: '500px',
        }}
      >
        {(['day', 'week', 'cycle', 'year'] as GroupDateFilter[]).map((val) => (
          <FilterButton key={val} value={val} />
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
