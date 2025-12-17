import {
  DeleteOutline,
  DeleteOutlined,
  EditOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import { useState } from 'react';

import { useDashboardUserEdit } from '../dashboard/context/user-edit.context';
import AddUserToGroupModal from './modals/dashboard-add-user-to-group.modal';
import { theme } from '@/app/style';
import type { Group } from '@/core/institution/type/group.type';
import { lib } from '@/lib';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { LINEAR_GRADIENT_BG } from '@/lib/common/const/ui.const';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import type { SetState } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useDashboardGroupActions } from '@/store/dashboard-group-actions.provider';

interface Props {
  group: Group;
  search: string;
  setOpenEditAthleteModal: SetState<boolean>;
}

export default function DashboardGroupCard(props: Props) {
  const { role } = useAuthenticatedAuth();

  const {
    setOpenDeleteGroupModal,
    setGroupToDelete,
    setOpenEditGroupModal,
    setGroupToEdit,
  } = useDashboardGroupActions();

  const { toggleUser } = useDashboardUserEdit();

  const { group, search, setOpenEditAthleteModal } = props;

  const [expand, setExpand] = useState(false);
  const [openAddUserToGroupModal, setOpenAddUserToGroupModal] = useState(false);

  const containerId = group.id;

  return (
    <Box
      key={containerId}
      id={containerId}
      width="100%"
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      sx={{
        background: LINEAR_GRADIENT_BG,
        borderRadius: 2,
        p: 2,
        border: `1px solid ${theme.palette.background.lightBorder}`,
        position: 'relative',
        overflow: 'hidden',
        ...styledScrollbarSx(theme),
      }}
      gap={1.5}
    >
      <Box
        width="100%"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography fontSize={26} fontWeight={600} lineHeight={1}>
          {group.name}
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          {lib.firebase.auth.isManager(role) && (
            <>
              <IconButton
                sx={{ p: 0, m: 0 }}
                onClick={() => {
                  setOpenEditGroupModal(true);
                  setGroupToEdit(group);
                }}
              >
                <EditOutlined fontSize="small" />
              </IconButton>
              <IconButton
                sx={{ p: 0, m: 0 }}
                onClick={() => {
                  setOpenDeleteGroupModal(true);
                  setGroupToDelete(group);
                }}
              >
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </>
          )}
          <IconButton
            sx={{ p: 0, m: 0 }}
            onClick={() => {
              setExpand(!expand);
            }}
          >
            {expand ? (
              <VisibilityOffOutlined fontSize="small" />
            ) : (
              <VisibilityOutlined fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Box>
      <Typography
        display="flex"
        justifyContent="center"
        alignItems="center"
        onClick={() => setOpenAddUserToGroupModal(true)}
        sx={{
          backgroundColor: theme.palette.primary.main,
          borderRadius: 10,
          px: 1,
          color: theme.palette.text.secondary,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        +Assign
      </Typography>

      <Box
        width="100%"
        display="flex"
        flexWrap={expand ? 'wrap' : 'nowrap'}
        justifyContent="flex-start"
        gap={1}
        sx={{
          overflow: expand ? 'auto' : 'hidden',
        }}
      >
        {(group.trainers || []).concat(group.members || []).map((user) => {
          if (!user || !user.displayName) return null;

          if (
            search.length &&
            !user.displayName.toLowerCase().includes(search.toLowerCase())
          )
            return null;

          const names = user.displayName.split(' ');
          return (
            <Box
              key={user.uid}
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap={1}
            >
              <Box
                sx={{
                  position: 'relative',
                }}
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
                {group.trainers?.some(
                  (trainer) => trainer.uid === user.uid
                ) && (
                  <Typography
                    sx={{
                      width: 12,
                      height: 12,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: '50%',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    T
                  </Typography>
                )}
              </Box>

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

      <AddUserToGroupModal
        open={openAddUserToGroupModal}
        setOpen={setOpenAddUserToGroupModal}
        group={group}
      />
    </Box>
  );
}
