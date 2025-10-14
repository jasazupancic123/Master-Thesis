'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/Pause';
import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Divider,
  Tooltip,
} from '@mui/material';

import useTrainingComponentMembers from '../hooks/use-members';

type Props = {
  componentId: string;
};

const AVATAR_SIZE = 16;
const BADGE_SIZE = 12;

export default function CompletedMembersGroup(props: Props) {
  const { membersInProgress, completedMembers } =
    useTrainingComponentMembers(props);

  return (
    <Box display="flex" alignItems="center">
      {/* In progress members */}
      {membersInProgress.length > 0 && (
        <Badge
          overlap="rectangular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          badgeContent={
            <PauseCircleIcon
              sx={{ width: BADGE_SIZE, height: BADGE_SIZE, color: 'orange' }}
            />
          }
        >
          <AvatarGroup total={membersInProgress.length} max={5}>
            {membersInProgress.map((user) => (
              <Tooltip title={user.displayName} key={user.uid}>
                <Avatar
                  src={user.photoURL || '/user_avatar.png'}
                  sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                />
              </Tooltip>
            ))}
          </AvatarGroup>
        </Badge>
      )}

      {membersInProgress.length > 0 && completedMembers.length > 0 && (
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      )}

      {/* Completed members */}
      {completedMembers.length > 0 && (
        <Badge
          overlap="rectangular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          badgeContent={
            <CheckCircleIcon
              sx={{ width: BADGE_SIZE, height: BADGE_SIZE, color: 'green' }}
            />
          }
        >
          <AvatarGroup total={completedMembers.length} max={5}>
            {completedMembers.map((user) => (
              <Tooltip title={user.displayName} key={user.uid}>
                <Avatar
                  src={user.photoURL || '/user_avatar.png'}
                  sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                />
              </Tooltip>
            ))}
          </AvatarGroup>
        </Badge>
      )}
    </Box>
  );
}
