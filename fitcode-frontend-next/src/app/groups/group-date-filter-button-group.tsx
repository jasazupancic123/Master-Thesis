import { GroupDateFilter } from '@/common/type/filter.type';
import FilterButton from '@/components/filter-button';
import { Box, ToggleButtonGroup } from '@mui/material';
import { GroupDateFilterButtonGroupProps } from './props';

export default function GroupDateFilterButtonGroup(
  props: GroupDateFilterButtonGroupProps
) {
  const { filter, setFilter } = props;

  return (
    <Box mx="auto" justifyContent="center" mb={2}>
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, val: GroupDateFilter) =>
          setFilter((prev) => (!val ? prev : val))
        }
        sx={{
          display: 'flex',
          bgcolor: 'background.paper',
          width: 700,
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
