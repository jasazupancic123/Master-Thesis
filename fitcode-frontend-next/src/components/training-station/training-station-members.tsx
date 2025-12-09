import { Avatar, Box, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import { theme } from '@/app/style';
import type { User } from '@/core/user/type/user.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useMain } from '@/store/main.provider';
import { useCoachTrainingStation } from '@/store/training-station.provider';
import { SearchBar } from '@/ui/search-bar/search-bar';

export default function TrainingStationMembers() {
  const { users: allUsers } = useMain();
  const {
    individualTrainings,
    station,
    selectedUser,
    selectedExercise,
    setSelectedUser,
    setSelectedSetIndex,
    workloads,
  } = useCoachTrainingStation();

  const users = allUsers.data.filter((u) =>
    station?.users.some((su) => su.uid === u.uid)
  );

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <Box
        display="flex"
        flexWrap="wrap"
        justifyContent="center"
        alignItems="flex-start"
        gap={2}
      >
        {users.map((user) => (
          <Box
            key={user.uid}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-start"
          >
            <Box
              sx={{
                border:
                  selectedUser?.uid === user.uid
                    ? `2px solid ${theme.palette.primary.main}`
                    : '2px solid transparent',
                borderRadius: '50%',
              }}
            >
              <Avatar
                key={user.uid}
                src={user.photoURL || USER_AVATAR_IMG_URL}
                sx={{
                  width: 50,
                  height: 50,
                  cursor: 'pointer',
                  filter: 'grayscale(100%)',
                }}
                onClick={() => {
                  setSelectedUser(user);

                  const individualTraining = individualTrainings.find(
                    (it) => it.userId === user.uid
                  );

                  if (!individualTraining) return;

                  const individualExercise = individualTraining.components
                    .flatMap((c) => c.supersets.flatMap((s) => s.exercises))
                    .find((ie) => ie.id === selectedExercise?.id);

                  if (!individualExercise) return;

                  const userExerciseWorkloads = workloads.filter(
                    (w) =>
                      w.userId === user.uid &&
                      w.exerciseId === selectedExercise?.id
                  );

                  const completedSets =
                    userExerciseWorkloads.length >=
                    individualExercise.sets.length
                      ? 0
                      : userExerciseWorkloads.length;

                  setSelectedSetIndex(completedSets);
                }}
              />
            </Box>

            <Typography
              fontSize={12}
              textAlign="center"
              sx={{
                mt: 0.5,
                maxWidth: 60,
                WebkitLineClamp: 2,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.displayName}
            </Typography>
          </Box>
        ))}
      </Box>
      {selectedUser && (
        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          <Avatar
            src={selectedUser.photoURL || USER_AVATAR_IMG_URL}
            sx={{
              width: 150,
              height: 150,
            }}
          />
          <Typography
            fontSize={20}
            fontWeight={700}
            textAlign="center"
            sx={{
              textTransform: 'uppercase',
            }}
          >
            {selectedUser.displayName}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
