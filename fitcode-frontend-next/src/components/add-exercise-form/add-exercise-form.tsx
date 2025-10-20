import { Box, Pagination, Typography } from '@mui/material';

import ExerciseFilter from '../exercises-list/exercise-filter';
import ExercisesList from '../exercises-list/exercises-list';
import type { AddExerciseFormProps } from '../trainer-group-day-view/props/props';
import useExerciseFormComponentExercises from './hooks/use-component-exercises';
import useExerciseFormFilters from './hooks/use-filters';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import { SearchBar } from '@/util/search-bar/search-bar';

export default function AddExerciseForm(props: AddExerciseFormProps) {
  const { selectedExerciseIds, setSelectedExerciseIds, component } = props;

  const screenSize = useScreenSize();
  const { pagination, setPagination } = useTrainerDayView();
  const componentExercisesContext =
    useExerciseFormComponentExercises(component);

  const {
    filters,
    setFilters,
    openFilters,
    setOpenFilters,
    search,
    setSearch,
    filteredExercises,
  } = useExerciseFormFilters(
    component,
    componentExercisesContext.componentExercises
  );

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
      <Box
        sx={{ py: 1, width: '50%', minWidth: 240, maxWidth: 400, mx: 'auto' }}
      >
        <SearchBar
          placeholder="Search Exercises"
          value={search}
          handleSearchChange={(e) => setSearch(e.target.value)}
          maxWidth="100%"
        />
      </Box>
      <Box
        width="100%"
        display="flex"
        flexDirection={screenSize.isMobile ? 'column-reverse' : 'row'}
        alignItems="center"
        justifyContent="center"
        sx={{ m: 2 }}
      >
        <Box width="15%" />
        <Box
          width={screenSize.isMobile ? '100%' : '70%'}
          display="flex"
          justifyContent="center"
        >
          <Pagination
            size="small"
            count={pagination.pages}
            color="primary"
            page={pagination.page}
            onChange={(_, page) => setPagination((prev) => ({ ...prev, page }))}
          />
        </Box>

        {/* Filters & Results */}
        <Box
          width="15%"
          display="flex"
          justifyContent={
            screenSize.isSmallerThanLaptop ? 'center' : 'flex-end'
          }
          alignItems="center"
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
            }}
          >
            {!screenSize.isSmallerThanLaptop && (
              <Typography variant="body2" color="text.primary">
                {pagination.total} results
              </Typography>
            )}

            <ExerciseFilter
              filters={filters}
              setFilters={setFilters}
              setPagination={setPagination}
              open={openFilters}
              setOpen={setOpenFilters}
            />
          </Box>
        </Box>
      </Box>

      <ExercisesList
        exercises={filteredExercises}
        addExerciseForm
        setSelectedExerciseIds={setSelectedExerciseIds}
        selectedExerciseIds={selectedExerciseIds}
      />
    </Box>
  );
}
