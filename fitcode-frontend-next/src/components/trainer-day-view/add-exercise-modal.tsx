import { useEffect, useState } from 'react';
import {
  Stack,
  IconButton,
  Grid,
  Box,
  Typography,
  Button,
  Grid2,
} from '@mui/material';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import { addExercise } from './state';
import { FilteredExercises } from './type';
import { SetState } from '@/common/type/state.type';
import { Training } from '@/controller/training/type/training.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { SearchBar } from '../search-bar';
import { TrainingExercise } from '@/controller/training/type/training-plan.type';

interface AddExerciseModalProps {
  token: string;
  training: Training;
  filteredExercises: FilteredExercises;
  setSelectedTrainings: SetState<Training[]>;
  components: Component[];
  exercises: Exercise[];
  selectedExercises: TrainingExercise[];
  setSelectedExercises: SetState<TrainingExercise[]>;
}

export default function AddExerciseModal(props: AddExerciseModalProps) {
  const {
    token,
    training,
    filteredExercises,
    setSelectedTrainings,
    components,
    exercises,
    selectedExercises,
    setSelectedExercises,
  } = props;

  const [searchQueryExcercise, setSearchQueryExercise] = useState('');
  const [filteredList, setFilteredList] =
    useState<FilteredExercises>(filteredExercises);

  useEffect(() => {
    if (searchQueryExcercise === '') {
      setFilteredList(filteredExercises);
    } else {
      setFilteredList((prev) => ({
        ...prev,
        data: filteredExercises.data.filter((exercise) =>
          exercise.name
            .toLowerCase()
            .includes(searchQueryExcercise.toLowerCase())
        ),
      }));
    }
  }, [searchQueryExcercise, filteredExercises]);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" width="100%">
      {/* Search Bar */}
      <SearchBar
        placeholder="Search Exercises"
        value={searchQueryExcercise}
        handleSearchChange={(e) => setSearchQueryExercise(e.target.value)}
        maxWidth={'85%'}
      />

      {/* Pagination Controls */}
      <Stack direction="row" spacing={2} mt={2} alignItems="center">
        <IconButton
          sx={{ width: 40, height: 40, p: 1 }}
          onClick={() => {
            setFilteredList((prev: FilteredExercises) => ({
              ...prev,
              pagination: {
                ...prev.pagination,
                page:
                  prev.pagination.page - 1 >= 1 ? prev.pagination.page - 1 : 1,
              },
            }));
          }}
        >
          <ArrowLeft />
        </IconButton>

        {/* Exercise List */}
        <Grid2 container direction="column" spacing={1} p={1} width="100%">
          {filteredList.data
            .sort((a, b) => {
              if (a.name < b.name) return -1;
              if (a.name > b.name) return 1;
              return 0;
            })
            .map((exercise) => {
              const isSelected = selectedExercises.some(
                (ex) => ex.id === exercise.id
              );

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
                  }}
                >
                  {/* Exercise Image */}
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      backgroundImage: `url(${
                        exercise.imageUrl ||
                        'https://mui.com/static/images/cards/contemplative-reptile.jpg'
                      })`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '8px',
                      flexShrink: 0,
                    }}
                  />

                  {/* Exercise Name */}
                  <Typography
                    variant="body1"
                    sx={{
                      flexGrow: 1,
                      textAlign: 'center',
                      marginLeft: 2,
                      px: 2,
                    }}
                  >
                    {exercise.name}
                  </Typography>

                  {/* Select/Deselect Button */}
                  <Button
                    variant={isSelected ? 'outlined' : 'contained'}
                    color="primary"
                    onClick={() => {
                      if (!isSelected) {
                        addExercise(
                          token,
                          training.id,
                          filteredList.componentId!,
                          filteredList.superset!,
                          exercise.id,
                          setSelectedTrainings,
                          components,
                          exercises
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

        <IconButton
          sx={{ width: 40, height: 40, p: 1 }}
          onClick={() => {
            setFilteredList((prev) => ({
              ...prev,
              pagination: {
                ...prev.pagination,
                page:
                  prev.pagination.page + 1 <= prev.pagination.pages
                    ? prev.pagination.page + 1
                    : prev.pagination.pages,
              },
            }));
          }}
        >
          <ArrowRight />
        </IconButton>
      </Stack>
    </Box>
  );
}
