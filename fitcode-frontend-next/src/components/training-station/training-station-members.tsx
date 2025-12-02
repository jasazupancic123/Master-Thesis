import { theme } from '@/app/style';
import { AuthUser } from '@/core/auth/type/user.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useCoachTrainingStation } from '@/store/training-station.provider';
import { useMain } from '@/store/main.provider';
import { SearchBar } from '@/ui/search-bar/search-bar';
import { Avatar, Box } from '@mui/material';
import { useMemo, useState } from 'react';

export default function TrainingStationMembers() {
  const { users: allUsers } = useMain();
  const { station, selectedUser, setSelectedUser } = useCoachTrainingStation();

  const users = allUsers.filter((u) =>
    station?.users.some((su) => su.uid === u.uid)
  );

  const [search, setSearch] = useState('');

  const filteredUsers = useMemo<AuthUser[]>(() => {
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
        alignItems="center"
        gap={2}
      >
        {filteredUsers.map((user) => (
          <Box
            sx={{
              border:
                selectedUser?.uid === user.uid
                  ? `2px solid ${theme.palette.primary.main}`
                  : 'none',
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
        ))}
      </Box>
    </Box>
  );
}
