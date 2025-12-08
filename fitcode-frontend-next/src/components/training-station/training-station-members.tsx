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
  const { station, selectedUser, setSelectedUser } = useCoachTrainingStation();

  const users = allUsers.data.filter((u) =>
    station?.users.some((su) => su.uid === u.uid)
  );

  const [search, setSearch] = useState('');

  const filteredUsers = useMemo<User[]>(() => {
    if (search.trim() === '') return users;

    const lowerSearch = search.toLowerCase();

    return users.filter((athlete) =>
      athlete.displayName?.toLowerCase().includes(lowerSearch)
    );
  }, [station, users, search]);

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <SearchBar
        placeholder="Search athletes"
        value={search}
        maxWidth={300}
        handleSearchChange={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSearch(e.target.value);
        }}
      />
      <Box
        display="flex"
        flexWrap="wrap"
        justifyContent="center"
        alignItems="flex-start"
        gap={2}
      >
        {filteredUsers
          .sort((a, b) =>
            (a.displayName || '').localeCompare(b.displayName || '')
          )
          .map((user) => (
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
                  onClick={() => setSelectedUser(user)}
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
    </Box>
  );
}
