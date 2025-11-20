import { Box, Menu, MenuItem, Typography } from '@mui/material';
import { useState } from 'react';

import type { Exercise } from '@/core/exercise/type/exercise.type';
import { SearchBar } from '@/ui/search-bar/search-bar';

interface Props {
  exercises: Exercise[];
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelectExercise: (exercise: Exercise) => void;
  hideExerciseIds?: string[];
  anchorRef?: React.RefObject<HTMLElement | null>;
  closeOnSelect?: boolean;
}

export default function ExerciseMenuDropdown({
  exercises,
  open,
  setOpen,
  onSelectExercise,
  hideExerciseIds,
  anchorRef,
  closeOnSelect = true,
}: Props) {
  const [search, setSearch] = useState('');
  const filteredExercises = exercises.filter(
    (e) =>
      !hideExerciseIds?.includes(e.id) &&
      e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Menu
      anchorEl={anchorRef?.current}
      open={open}
      onClose={() => {
        setOpen(false);
      }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ top: 24 }}
    >
      {exercises.length === 0 ? (
        <Typography sx={{ px: 1 }}>No exercises found</Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap={1}>
          <SearchBar
            placeholder="Search Exercises"
            value={search}
            handleSearchChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSearch(e.target.value);
            }}
            maxWidth="100%"
          />

          <Box
            display="flex"
            flexDirection="column"
            maxHeight={300}
            sx={{ overflowY: 'auto' }}
          >
            {filteredExercises
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((exercise) => (
                <MenuItem
                  key={exercise.id}
                  onClick={() => {
                    onSelectExercise(exercise);
                    if (closeOnSelect) setOpen(false);
                  }}
                >
                  <Box
                    key={exercise.id}
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{ p: 1, cursor: 'pointer' }}
                  >
                    <Typography>{exercise.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
          </Box>
        </Box>
      )}
    </Menu>
  );
}
