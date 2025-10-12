import { FilterList } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  SwipeableDrawer,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import AttributeFilter from '../attribute-filter/attribute-filter';
import { SearchBar } from '../../util/search-bar/search-bar';
import type { Pagination } from '@/common/type/paginate.type';
import type { SetState } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import { ExerciseAttributeService } from '@/controller/exercise/exercise-attribute.service';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { AttributeFilters } from '@/sites/exercises.page';

type AttributeValue =
  | string
  | number
  | boolean
  | [number, number] // range
  | Set<string>; // select/multiselect

interface Props {
  filters: AttributeFilters;
  setFilters: SetState<AttributeFilters>;
  open: boolean;
  setOpen: SetState<boolean>;
  setPagination?: SetState<Pagination>;
}

const attributes = ExerciseAttributeService.getAttributes();

export default function ExerciseFilter(props: Props) {
  const { filters, setFilters, open, setOpen, setPagination } = props;

  const [search, setSearch] = useState<string>('');

  function handleFilterChange(
    field: string,
    value: AttributeValue | undefined
  ) {
    if (Array.isArray(value) && !value.length) value = undefined;
    if (typeof value === 'string' && value.trim() === '') value = undefined;
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination?.((prev) => ({ ...prev, page: 1 }));
  }

  function renderAttributeFilter(attribute: Attribute<Exercise>) {
    if (!attribute) return null;

    return (
      <Box key={attribute.field} mb={2}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          {attribute.name}
        </Typography>

        {attribute.searchBar && (
          <Box
            sx={{
              py: 1,
              width: '50%',
              minWidth: 240,
              maxWidth: 400,
            }}
          >
            <SearchBar
              placeholder="Search Equipment"
              value={search}
              handleSearchChange={(e) => setSearch(e.target.value)}
              maxWidth="100%"
            />
          </Box>
        )}

        <AttributeFilter
          attribute={attribute}
          value={filters[attribute.field]}
          onChange={(val) => handleFilterChange(attribute.field, val)}
          search={search}
        />

        <Divider sx={{ mt: 2 }} />
      </Box>
    );
  }

  const attributeList: Attribute<Exercise>[] = [
    attributes.find((a) => a.field === 'equipment')!,
    attributes.find((a) => a.field === 'bodyRegions')!,
    attributes.find((a) => a.field === 'loadingSides')!,
    attributes.find((a) => a.field === 'locations')!,
    attributes.find((a) => a.field === 'liftPriorities')!,
    attributes.find((a) => a.field === 'movementDirections')!,
  ];

  return (
    <Box>
      <IconButton
        color="primary"
        onClick={() => setOpen((prev) => !prev)}
        size="large"
      >
        <FilterList />
      </IconButton>

      <SwipeableDrawer
        anchor="right"
        sx={{ zIndex: 1500 }}
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        swipeAreaWidth={24}
        disableSwipeToOpen={false}
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ width: 320, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>

          <Stack spacing={2}>
            {attributeList.map(renderAttributeFilter)}

            {/* Reset Filters */}
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setFilters({})}
              fullWidth
            >
              Reset Filters
            </Button>

            {/* Close */}
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpen(false)}
              fullWidth
            >
              Apply Filters
            </Button>
          </Stack>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
}
