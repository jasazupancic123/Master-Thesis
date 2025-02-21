'use client';

import { GroupDateFilter } from '@/common/type/filter.type';
import FilterButton from '@/components/filter-button';
import { useScreenSize } from '@/context/screen-size-provider';
import { Box, Button, ToggleButtonGroup, Typography } from '@mui/material';
import { GroupDateFilterButtonGroupProps } from './props';
import toast from 'react-hot-toast';
import { useGroup } from '@/context/group-provider';

export default function GroupDateFilterButtonGroup(
  props: GroupDateFilterButtonGroupProps
) {
  const { filter, setFilter } = props;
  const screenSize = useScreenSize();
  const { detectedChanges, setDetectedChanges } = useGroup();
  let alertedDay = false;
  let alertedYear = false;
  let toastId: string | null = null;

  return (
    <Box mx="auto" justifyContent="center">
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, val: GroupDateFilter) => {
          if (!val) return;
          if (
            ((filter === 'day' && !alertedDay) ||
              (filter === 'year' && !alertedYear)) &&
            detectedChanges
          ) {
            toastId = toast.custom((t: any) => (
              <Box
                sx={{
                  backgroundColor: 'white',
                  color: 'white',
                  borderRadius: '10px',
                  padding: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body1" sx={{ color: 'black' }}>
                  ⚠️ Any unsaved changes will be lost
                </Typography>
              </Box>
            ));
            if (filter === 'day') alertedDay = true;
            if (filter === 'year') alertedYear = true;
            return;
          }
          if (toastId) {
            toast.dismiss(toastId);
            toastId = null;
          }
          setDetectedChanges(false);
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
          maxWidth: 700,
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
