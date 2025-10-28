import {
  Box,
  Button,
  Menu,
  MenuItem,
  Pagination,
  Typography,
} from '@mui/material';

import ExerciseFilter from '../exercises-list/exercise-filter';
import ExercisesList from '../exercises-list/exercises-list';
import type { AddExerciseFormProps } from '../trainer-group-day-view/props/props';
import useExerciseFormComponentExercises from './hooks/use-component-exercises';
import useExerciseFormFilters from './hooks/use-filters';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import { SearchBar } from '@/ui/search-bar/search-bar';
import { KeyboardArrowDown } from '@mui/icons-material';
import { theme } from '@/app/style';
import useComponentFilter from './hooks/use-component-filter';

export default function AddExerciseForm(props: AddExerciseFormProps) {
  const { selectedExerciseIds, setSelectedExerciseIds, component } = props;

  const screenSize = useScreenSize();
  const { pagination, setPagination } = useTrainerDayView();
  const componentExercisesContext =
    useExerciseFormComponentExercises(component);

  const {
    filterComponents,
    selectedComponentsIds,
    setSelectedComponentsIds,
    anchorEl,
    open,
    handleClick,
    handleClose,
  } = useComponentFilter();

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
    componentExercisesContext.componentExercises,
    selectedComponentsIds
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
        gap={screenSize.isMobile ? 2 : 0}
      >
        <Box width="15%">
          <Button
            id="demo-customized-button"
            aria-haspopup="true"
            variant="contained"
            disableElevation
            onClick={handleClick}
            endIcon={<KeyboardArrowDown />}
            sx={{
              py: 0.5,
            }}
          >
            Filter{' '}
            {selectedComponentsIds.length
              ? `(${selectedComponentsIds.length})`
              : ''}
          </Button>
          <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
            {filterComponents
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => (
                <MenuItem
                  key={c.id}
                  value={c.id}
                  onClick={() => {
                    if (selectedComponentsIds.includes(c.id)) {
                      setSelectedComponentsIds((prev) =>
                        prev.filter((id) => id !== c.id)
                      );
                    } else {
                      setSelectedComponentsIds((prev) => [...prev, c.id]);
                    }
                  }}
                  sx={
                    selectedComponentsIds.includes(c.id)
                      ? {
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.text.secondary,
                          fontWeight: 500,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                          },
                        }
                      : {}
                  }
                >
                  {c.name}
                </MenuItem>
              ))}
          </Menu>
        </Box>
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
