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
import { useEffect, useState } from 'react';

import { SearchBar } from '../search-bar/search-bar';
import type { AddExerciseFormProps } from '../trainer-day-view/props';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

export default function AddExerciseForm(props: AddExerciseFormProps) {
  const screenSize = useScreenSize();
  const { selectedExercisesIds, setSelectedExercisesIds, component } = props;
  const { exercises: allExercises } = useMain();
  const {
    filteredExercises: exercises,
    setPagination,
    search,
    setSearch,
  } = useTrainerDayViewContext();

  const [filteredExercises, setFilteredExercises] =
    useState<Exercise[]>(exercises);

  const [componentExercises, setComponentExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!component) return;

    if (component.id === WARMUP_ID || component.id === COOLDOWN_ID) {
      setComponentExercises(allExercises);
      return;
    }

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
          const filteredExercises = componentExercises.filter((exercise) =>
            exercise.name.toLowerCase().includes(e.target.value.toLowerCase())
          );
          setFilteredExercises(filteredExercises);
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
        px={search === '' ? 0 : 3}
      >
        <IconButton
          sx={{
            width: 40,
            height: 40,
            p: 1,
            display: search === '' ? undefined : 'none',
          }}
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
            sx={{
              flexGrow: 1,
              minWidth: 0,
              maxHeight: 500,
              pr: 1,
              flexWrap: 'nowrap',
            }}
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
                        } else {
                          setSelectedExercisesIds((prev) =>
                            prev.filter((id) => id !== exercise.id)
                          );
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
          sx={{
            width: 40,
            height: 40,
            p: 1,
            display: search === '' ? undefined : 'none',
          }}
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
