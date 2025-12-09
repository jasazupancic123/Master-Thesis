import { useDroppable } from '@dnd-kit/core';
import { GridView, TableRows } from '@mui/icons-material';
import { alpha, Avatar, Box, IconButton, Typography } from '@mui/material';
import { useState } from 'react';

import { useDashboardUserEdit } from '../dashboard/context/user-edit.context';
import DashboardGroupCardUsers from './dashboard-group-card-users';
import { theme } from '@/app/style';
import type { Group } from '@/core/institution/type/group.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { LINEAR_GRADIENT_BG } from '@/lib/common/const/ui.const';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import type { SetState } from '@/lib/common/type/state.type';

interface Props {
  group: Group;
  hoveredUser: { userId: string | null; groupId: string | null };
  setHoveredUser: SetState<{ userId: string | null; groupId: string | null }>;
  isDragging: boolean;
  setOpenEditAthleteModal: SetState<boolean>;
}

export default function DashboardGroupCard(props: Props) {
  const {
    group,
    hoveredUser,
    setHoveredUser,
    isDragging,
    setOpenEditAthleteModal,
  } = props;

  const { toggleUser } = useDashboardUserEdit();

  const containerId = group.id;
  const { setNodeRef } = useDroppable({
    id: containerId,
    data: { type: 'group', groupId: group.id },
  });

  const [listView, setListView] = useState(true);

  return (
    <Box
      key={containerId}
      id={containerId}
      ref={setNodeRef}
      width="100%"
      maxHeight={500}
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
      sx={{
        background: LINEAR_GRADIENT_BG,
        borderRadius: 2,
        p: 1,
        boxShadow: hoveredUser.groupId === group.id ? 6 : 2,
        border: isDragging
          ? `1px solid ${alpha(theme.palette.primary.main, 0.5)}`
          : undefined,
        overflowY: 'auto',
        position: 'relative',
        ...styledScrollbarSx(theme),
      }}
      gap={1}
    >
      <IconButton
        onClick={() => setListView((prev) => !prev)}
        sx={{ position: 'absolute', top: 6, right: 4, p: 0, m: 0 }}
      >
        {listView ? (
          <TableRows fontSize="small" />
        ) : (
          <GridView fontSize="small" />
        )}
      </IconButton>
      <Typography
        width="90%"
        textAlign="center"
        variant="h6"
        lineHeight={1}
        sx={{ mx: 'auto' }}
      >
        {group.name}
      </Typography>

      {listView ? (
        <>
          <DashboardGroupCardUsers
            title="Trainers"
            users={group.trainers || []}
            group={group}
            hoveredUser={hoveredUser}
            setHoveredUser={setHoveredUser}
            setOpenEditAthleteModal={setOpenEditAthleteModal}
          />

          <DashboardGroupCardUsers
            title="Athletes"
            users={group.members || []}
            group={group}
            hoveredUser={hoveredUser}
            setHoveredUser={setHoveredUser}
            setOpenEditAthleteModal={setOpenEditAthleteModal}
          />
        </>
      ) : (
        <Box width="100%" display="flex" flexWrap="wrap" gap={1}>
          {(group.trainers || []).concat(group.members || []).map((user) => {
            if (!user || !user.displayName) return null;

            const names = user.displayName.split(' ');
            return (
              <Box
                key={user.uid}
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={1}
                sx={{ position: 'relative' }}
              >
                <Avatar
                  className="avatar-border"
                  src={user.photoURL || USER_AVATAR_IMG_URL}
                  sx={{
                    width: 50,
                    height: 50,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    toggleUser(user);
                    setOpenEditAthleteModal(true);
                  }}
                />

                <Typography
                  variant="body2"
                  width={74}
                  maxWidth={74}
                  sx={{
                    textAlign: 'center',
                    fontWeight: 400,
                    fontSize: 12,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {names.length > 1 ? (
                    <>
                      {names[0]}
                      <br />
                      {names[1].toUpperCase()}
                    </>
                  ) : (
                    <>{user.displayName.toUpperCase()}</>
                  )}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
