import { theme } from '@/app/style';
import { AuthUser } from '@/core/auth/type/user.type';
import { Group } from '@/core/group/type/group.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { SetState } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { Remove } from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';

interface Props {
  title: string;
  users: AuthUser[];
  group: Group;
  hoveredUser: { userId: string | null; groupId: string | null };
  setHoveredUser: SetState<{ userId: string | null; groupId: string | null }>;
}

export default function DashboardGroupCardUsers(props: Props) {
  const { removeGroupMember, updateGroup } = useDashboard();

  const { title, users, group, hoveredUser, setHoveredUser } = props;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      px={1}
    >
      <Typography
        width="100%"
        textAlign="start"
        fontSize={12}
        fontWeight={400}
        sx={{
          color: alpha(theme.palette.text.primary, 0.6),
        }}
      >
        {title}
      </Typography>

      <Box width="100%" display="flex" flexDirection="column" gap={1}>
        {users.map((user) => {
          return (
            <Box
              key={user.uid}
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
              sx={{
                position: 'relative',
              }}
            >
              <Avatar
                src={user.photoURL || USER_AVATAR_IMG_URL}
                sx={{ width: 40, height: 40 }}
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
                      onClick={async () => {
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
                        right: 0,
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
