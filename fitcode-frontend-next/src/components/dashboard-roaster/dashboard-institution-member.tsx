import { useSortable } from '@dnd-kit/sortable';
import { Avatar, Box, Typography } from '@mui/material';

import { DASHBOARD_MEMBERS_AVATAR_SIZE } from '../dashboard/modals/edit-athlete-modal';
import { theme } from '@/app/style';
import { UserRole } from '@/core/user/enum/user-role.enum';
import type { User } from '@/core/user/type/user.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useMain } from '@/store/main.provider';

interface Props {
  member: User;
  isBeingDragged?: boolean;
  isDragging?: boolean;
}

export default function DashboardInstitutionMember(props: Props) {
  const { institution } = useMain();

  const { member, isBeingDragged, isDragging } = props;

  const { attributes, listeners, setNodeRef } = useSortable({
    id: member.uid,
  });

  const isTrainer = institution?.members?.some(
    (m) => m.id === member.uid && m.role === UserRole.TRAINER
  );

  return (
    <Box
      width={50}
      minWidth={50}
      maxWidth={50}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={0.5}
      sx={{
        touchAction: 'pan-x',
        position: 'relative',
      }}
    >
      <Box
        key={member.uid}
        ref={isDragging ? undefined : setNodeRef}
        {...attributes}
        {...listeners}
        sx={{
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Avatar
          src={member.photoURL || USER_AVATAR_IMG_URL}
          sx={{
            width: DASHBOARD_MEMBERS_AVATAR_SIZE,
            height: DASHBOARD_MEMBERS_AVATAR_SIZE,
          }}
        />
      </Box>

      {isTrainer && (
        <Box
          width={12}
          height={12}
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: theme.palette.primary.main,
            borderRadius: '50%',
          }}
        >
          <Typography
            fontSize={10}
            fontWeight={600}
            lineHeight={1}
            sx={{
              color: theme.palette.text.secondary,
            }}
          >
            T
          </Typography>
        </Box>
      )}

      {!isBeingDragged && (
        <Typography
          variant="caption"
          textAlign="center"
          lineHeight={1.2}
          sx={{
            WebkitLineClamp: 2,
            maxWidth: 50,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            userSelect: 'none',
          }}
        >
          {member.displayName
            ?.split(' ')
            .slice(0, 2)
            .map((name, index) =>
              index === 0 ? `${name} ` : name.toUpperCase()
            ) || 'No Name'}
        </Typography>
      )}
    </Box>
  );
}
