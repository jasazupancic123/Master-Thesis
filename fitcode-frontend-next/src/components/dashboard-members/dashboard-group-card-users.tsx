import { Remove } from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';

import { useDashboardUserEdit } from '../dashboard/context/user-edit.context';
import { DASHBOARD_MEMBERS_AVATAR_SIZE } from '../dashboard/modals/edit-athlete-modal';
import { theme } from '@/app/style';
import type { Group } from '@/core/institution/type/group.type';
import type { User } from '@/core/user/type/user.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import type { SetState } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';

interface Props {
  title: string;
  users: User[];
  group: Group;
  hoveredUser: { userId: string | null; groupId: string | null };
  setHoveredUser: SetState<{ userId: string | null; groupId: string | null }>;
  setOpenEditAthleteModal: SetState<boolean>;
}

export default function DashboardGroupCardUsers(props: Props) {
  const { removeGroupMember, updateGroup } = useDashboard();

  const { toggleUser } = useDashboardUserEdit();

  const {
    title,
    users,
    group,
    hoveredUser,
    setHoveredUser,
    setOpenEditAthleteModal,
  } = props;

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
      <Typography
        width="100%"
        textAlign="start"
        fontSize={12}
        fontWeight={400}
        sx={{
          color: alpha(theme.palette.text.primary, 0.6),
        }}
      >
        {title} - {users.length}
      </Typography>

      <Box width="100%" display="flex" flexDirection="column">
        {users
          .sort((a, b) =>
            (a.displayName || '').localeCompare(b.displayName || '')
          )
          .map((user) => {
            return (
              <Box
                key={`${user.uid}123`}
                width="100%"
                display="flex"
                alignItems="center"
                gap={1}
                onMouseEnter={() => {
                  setHoveredUser({ userId: user.uid, groupId: group.id });
                }}
                onMouseLeave={() => {
                  setHoveredUser({ userId: null, groupId: null });
                }}
                onClick={() => {
                  toggleUser(user);
                  setOpenEditAthleteModal(true);
                }}
                sx={{
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor:
                    hoveredUser.userId === user.uid &&
                    hoveredUser.groupId === group.id
                      ? alpha(theme.palette.text.primary, 0.1)
                      : undefined,
                  py: 0.5,
                  px: 1,
                }}
              >
                <Avatar
                  src={user.photoURL || USER_AVATAR_IMG_URL}
                  sx={{
                    width: DASHBOARD_MEMBERS_AVATAR_SIZE,
                    height: DASHBOARD_MEMBERS_AVATAR_SIZE,
                  }}
                />
                <Box display="flex" flexDirection="column" maxWidth={'90%'}>
                  <Typography fontSize={14}>{user.displayName}</Typography>
                  <Typography
                    fontSize={10}
                    sx={{ color: alpha(theme.palette.text.primary, 0.8) }}
                  >
                    {user.email}
                  </Typography>
                </Box>
                {hoveredUser.userId === user.uid &&
                  hoveredUser.groupId === group.id && (
                    <Tooltip title="Remove from group">
                      <IconButton
                        onClick={async (e) => {
                          e.stopPropagation();
                          const isTrainer = group.trainerIds.includes(user.uid);

                          if (isTrainer) {
                            const updatedGroup: Group = {
                              ...group,
                              trainerIds: group.trainerIds.filter(
                                (id) => id !== user.uid
                              ),
                            };

                            await updateGroup(updatedGroup.id, updatedGroup);
                            return;
                          }

                          await removeGroupMember(user.uid, group.id);
                        }}
                        sx={{
                          position: 'absolute',
                          right: 4,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: theme.palette.error.main,
                          borderRadius: '50%',
                          p: 0,
                          m: 0,
                        }}
                      >
                        <Remove
                          sx={{
                            fontSize: 16,
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                  )}
              </Box>
            );
          })}
      </Box>
    </Box>
  );
}
