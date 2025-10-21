import { FilterList } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  Stack,
  SwipeableDrawer,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import renderAttributeFilter from './render-attribute-filter';
import { app } from '@/core/app.service';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { Pagination } from '@/lib/common/type/paginate.type';
import type { SetState } from '@/lib/common/type/state.type';
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

const attributes = app.exercise.attribute.getAll();

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
            {attributeList.map((attribute) =>
              renderAttributeFilter({
                attribute,
                search,
                filters,
                setSearch,
                handleFilterChange,
              })
            )}

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
