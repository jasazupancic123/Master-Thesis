import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useCoachTrainingStation } from '@/store/coach-training-station.provider';
import { useMain } from '@/store/main.provider';
import { Avatar, Box } from '@mui/material';

export default function TrainingStationMembers() {
  const { users: allUsers } = useMain();
  const { station, setSelectedUser } = useCoachTrainingStation();

  const users = allUsers.filter((u) =>
    station?.users.some((su) => su.uid === u.uid)
  );

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      justifyContent="center"
      alignItems="center"
      gap={2}
    >
      {users.map((user) => (
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
      ))}
    </Box>
  );
}
