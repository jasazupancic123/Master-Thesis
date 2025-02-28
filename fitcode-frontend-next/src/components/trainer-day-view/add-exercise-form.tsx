import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import {
  Box,
  Button,
  Grid,
  Grid2,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { SearchBar } from '../search-bar';
import { AddExerciseFormProps } from './props';
import { useScreenSize } from '@/context/screen-size-provider';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { useEffect, useState } from 'react';

export default function AddExerciseForm(props: AddExerciseFormProps) {
  const screenSize = useScreenSize();
  const { selectedExercisesIds, setSelectedExercisesIds, component } = props;
  const {
    filteredExercises: exercises,
    exercises: allExercises,
    setPagination,
    search,
    setSearch,
  } = useTrainerDayViewContext();

  const [filteredExercises, setFilteredExercises] =
    useState<Exercise[]>(exercises);

  const [componentExercises, setComponentExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!component) return;

    setComponentExercises(
      allExercises.filter((exercise) =>
        exercise.components?.some((c) => c.parents.includes(component.id))
      )
    );
  }, [component]);

  useEffect(() => {
    if (search === '') {
      setFilteredExercises(exercises);
    }
  }, [search]);

  useEffect(() => {
    setSearch('');
    setFilteredExercises(exercises);
  }, [exercises]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      width="100%"
      maxWidth="100%"
      overflow="hidden"
    >
      {/* Search Bar */}
      <SearchBar
        placeholder="Search Exercises"
        value={search}
        handleSearchChange={(e) => {
          setFilteredExercises(
            componentExercises.filter((exercise) =>
              exercise.name.toLowerCase().includes(e.target.value.toLowerCase())
            )
          );
          setSearch(e.target.value);
        }}
        maxWidth="85%"
      />

      {/* Pagination Controls */}
      <Stack
        direction="row"
        spacing={2}
        mt={2}
        alignItems="center"
        justifyContent="center"
        width="100%"
        flexWrap="nowrap"
      >
        <IconButton
          sx={{ width: 40, height: 40, p: 1 }}
          onClick={() => {
            setPagination((prev) => ({
              ...prev,
              page: prev.page - 1 >= 1 ? prev.page - 1 : 1,
            }));
          }}
        >
          <ArrowLeft />
        </IconButton>

        {/* Exercise List */}
        <Box width="100%" maxWidth="100%" overflow="hidden">
          <Grid2
            container
            direction="column"
            width="100%"
            overflow="auto"
            sx={{ flexGrow: 1, minWidth: 0 }}
          >
            {filteredExercises
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((exercise) => {
                const isSelected = selectedExercisesIds.includes(exercise.id);

                return (
                  <Grid
                    key={exercise.id}
                    item
                    xs={12}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #ddd',
                      padding: '8px 0',
                      flexWrap: 'nowrap',
                      minWidth: 0,
                    }}
                  >
                    {/* Exercise Image */}

                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '8px',
                        flexShrink: 0,
                        backgroundImage: `url(${exercise.imageUrl || '/fitcode_logo_transparent_square.png'})`,
                      }}
                    />

                    {/* Exercise Name */}
                    <Tooltip title={exercise.name} placement="top">
                      <Typography
                        variant="body1"
                        sx={{
                          textAlign: 'center',
                          flexGrow: 1,
                          minWidth: 0,
                          px: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: screenSize.isMobile
                            ? 150
                            : search === ''
                              ? 200
                              : 175,
                        }}
                      >
                        {exercise.name}
                      </Typography>
                    </Tooltip>

                    {/* Select/Deselect Button */}
                    <Button
                      sx={{ width: 75, height: 35, flexShrink: 0 }}
                      variant={isSelected ? 'outlined' : 'contained'}
                      color="primary"
                      onClick={() => {
                        if (!isSelected) {
                          setSelectedExercisesIds((prev) => [
                            ...prev,
                            exercise.id,
                          ]);
                        }
                      }}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </Button>
                  </Grid>
                );
              })}
          </Grid2>
        </Box>

        <IconButton
          sx={{ width: 40, height: 40, p: 1 }}
          onClick={() => {
            setPagination((prev) => ({
              ...prev,
              page: prev.page + 1 <= prev.pages ? prev.page + 1 : prev.pages,
            }));
          }}
        >
          <ArrowRight />
        </IconButton>
      </Stack>
    </Box>
  );
}
