import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import {
  Box,
  Button,
  Grid,
  Grid2,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { SearchBar } from '../search-bar';
import { AddExerciseFormProps } from './props';

export default function AddExerciseForm(props: AddExerciseFormProps) {
  const { selectedExercisesIds, setSelectedExercisesIds } = props;
  const { filteredExercises, setPagination, search, setSearch } =
    useTrainerDayViewContext();

  return (
    <Box display="flex" flexDirection="column" alignItems="center" width="100%">
      {/* Search Bar */}
      <SearchBar
        placeholder="Search Exercises"
        value={search}
        handleSearchChange={(e) => setSearch(e.target.value)}
        maxWidth={'85%'}
      />

      {/* Pagination Controls */}
      <Stack direction="row" spacing={2} mt={2} alignItems="center">
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
        <Grid2 container direction="column" spacing={1} p={1} width="100%">
          {filteredExercises
            .sort((a, b) => {
              if (a.name < b.name) return -1;
              if (a.name > b.name) return 1;
              return 0;
            })
            .map((exercise) => {
              const isSelected = selectedExercisesIds.some(
                (id) => id === exercise.id
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
                  {exercise.videoUrl ? (
                    <>
                      <video
                        src={exercise.videoUrl}
                        muted
                        style={{
                          width: 60,
                          height: 60,
                        }}
                      />
                    </>
                  ) : (
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '8px',
                        flexShrink: 0,
                        backgroundImage: `url(${
                          exercise.imageUrl ||
                          'https://mui.com/static/images/cards/contemplative-reptile.jpg'
                        })`,
                      }}
                    />
                  )}

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
