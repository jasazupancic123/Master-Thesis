import { theme } from '@/app/style';
import { Group } from '@/core/group/type/group.type';
import { alpha, Box, Typography } from '@mui/material';
import DashboardGroupCardUsers from './dashboard-group-card-users';
import { useDroppable } from '@dnd-kit/core';
import { SetState } from '@/lib/common/type/state.type';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';

interface Props {
  group: Group;
  hoveredUser: { userId: string | null; groupId: string | null };
  setHoveredUser: SetState<{ userId: string | null; groupId: string | null }>;
  isDragging: boolean;
}

export default function DashboardGroupCard(props: Props) {
  const { group, hoveredUser, setHoveredUser, isDragging } = props;

  const containerId = group.id;
  const { setNodeRef } = useDroppable({ id: containerId });

  return (
    <Box
      ref={setNodeRef}
      width={396}
      maxHeight={600}
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.background.dark} 0%, ${alpha(theme.palette.background.light, 0.5)} 100%, ${theme.palette.background.light} 100%)`,
        borderRadius: 2,
        p: 1,
        boxShadow: hoveredUser.groupId === group.id ? 6 : 2,
        border: isDragging
          ? `1px solid ${alpha(theme.palette.primary.main, 0.5)}`
          : undefined,
        overflowY: 'auto',
        ...styledScrollbarSx(theme),
      }}
      gap={1}
    >
      <Typography width="100%" textAlign="center" variant="h6" lineHeight={1}>
        {group.name}
      </Typography>
      <DashboardGroupCardUsers
        title="Trainers"
        users={group.trainers || []}
        group={group}
        hoveredUser={hoveredUser}
        setHoveredUser={setHoveredUser}
      />
      <DashboardGroupCardUsers
        title="Athletes"
        users={group.members || []}
        group={group}
        hoveredUser={hoveredUser}
        setHoveredUser={setHoveredUser}
      />
    </Box>
  );
}
