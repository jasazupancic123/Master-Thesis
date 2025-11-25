import { Add, Delete, Edit } from '@mui/icons-material';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

import { DASHBOARD_ALL_GROUPS_SELECTED_ID } from '../dashboard/constant/dashboard.const';
import AddGroupModal from '../dashboard/modals/add-group-modal';
import DeleteGroupModal from '../dashboard/modals/delete-group-modal';
import EditGroupModal from '../dashboard/modals/edit-group-modal';
import { INDEX_DB_LAST_SELECTED_DASHBOARD_GROUP_ID } from '../report-athlete-exercise/const/index-db-id.const';
import { theme } from '@/app/style';
import type { Group } from '@/core/group/type/group.type';
import { lib } from '@/lib';
import type { SetState } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

interface Props {
  achorElRef: RefObject<HTMLDivElement | null>;
  openGroupsMenu: boolean;
  setOpenGroupsMenu: SetState<boolean>;
}

export default function DashboardSidebarGroupMenu(props: Props) {
  const { role } = useAuthenticatedAuth();
  const { groups } = useMain();
  const { selectedInstitution, selectedGroups, setSelectedGroups } =
    useDashboard();

  const { achorElRef, openGroupsMenu, setOpenGroupsMenu } = props;

  const [openAddGroupModal, setOpenAddGroupModal] = useState(false);
  const [openEditGroupModal, setOpenEditGroupModal] = useState(false);
  const [openDeleteGroupModal, setOpenDeleteGroupModal] = useState(false);

  const [institutionAndTrainerGroups, setInstitutionAndTrainerGroups] =
    useState<Group[]>([]);

  useEffect(() => {
    if (!selectedInstitution) return;

    const filteredGroups = (selectedInstitution.groups || []).filter((g) =>
      groups.some((sg) => sg.id === g.id)
    );

    setInstitutionAndTrainerGroups(filteredGroups);
  }, [selectedInstitution]);

  const groupActions = [
    lib.firebase.auth.isManager(role)
      ? {
          title: 'Add group',
          icon: <Add fontSize="small" />,
          onClick: () => {
            setOpenAddGroupModal(true);
            setOpenGroupsMenu(false);
          },
        }
      : undefined,
    {
      title: 'Edit group',
      icon: <Edit fontSize="small" />,
      onClick: () => {
        setOpenEditGroupModal(true);
        setOpenGroupsMenu(false);
      },
    },
    lib.firebase.auth.isManager(role)
      ? {
          title: 'Delete group',
          icon: <Delete fontSize="small" />,
          onClick: () => {
            setOpenDeleteGroupModal(true);
            setOpenGroupsMenu(false);
          },
        }
      : undefined,
  ].filter((action) => action !== undefined);

  return (
    <>
      <Menu
        anchorEl={achorElRef.current}
        open={openGroupsMenu}
        onClose={() => {
          setOpenGroupsMenu(false);
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{ top: !selectedGroups.length ? 20 : 48 }}
        PaperProps={{
          sx: {
            overflow: 'visible', // allow the actions container to "stick out" to the right
            backgroundColor: theme.palette.background.selectedBackground,
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
          }}
        >
          {/* GROUP LIST */}
          {!institutionAndTrainerGroups.length ? (
            <Typography sx={{ px: 1 }}>No groups</Typography>
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              sx={{
                maxHeight: 300,
                overflowY: 'auto',
              }}
            >
              <MenuItem
                value={DASHBOARD_ALL_GROUPS_SELECTED_ID}
                onClick={async () => {
                  setSelectedGroups(
                    (selectedInstitution?.groups || []).filter((g) =>
                      groups.some((sg) => sg.id === g.id)
                    ) || []
                  );
                  setOpenGroupsMenu(false);

                  await lib.common.indexedDb.items.put({
                    id: INDEX_DB_LAST_SELECTED_DASHBOARD_GROUP_ID,
                    payload: DASHBOARD_ALL_GROUPS_SELECTED_ID,
                    updatedAt: new Date().getTime(),
                  });
                }}
              >
                <Typography>All</Typography>
              </MenuItem>
              {institutionAndTrainerGroups
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((group: Group) => (
                  <MenuItem
                    key={group.id}
                    value={group.id}
                    onClick={async () => {
                      setSelectedGroups([group]);
                      setOpenGroupsMenu(false);

                      await lib.common.indexedDb.items.put({
                        id: INDEX_DB_LAST_SELECTED_DASHBOARD_GROUP_ID,
                        payload: group.id,
                        updatedAt: new Date().getTime(),
                      });
                    }}
                  >
                    <Typography>{group.name}</Typography>
                  </MenuItem>
                ))}
            </Box>
          )}

          {/* ACTIONS BAR – FLOATING TO THE RIGHT */}
          {!!groupActions.length && (
            <Paper
              elevation={3}
              sx={{
                position: 'absolute',
                top: -48,
                right: -54, // move it outside the main menu paper to the right
                display: 'flex',
                gap: 1,
                border: `1px solid ${theme.palette.primary.main}`,
                borderRadius: 1,
              }}
            >
              {groupActions.map((action) => (
                <Tooltip
                  key={action.title}
                  title={action.title}
                  arrow
                  placement="top"
                >
                  <IconButton
                    size="small"
                    onClick={action.onClick}
                    sx={{ p: 0.5 }}
                  >
                    {action.icon}
                  </IconButton>
                </Tooltip>
              ))}
            </Paper>
          )}
        </Box>
      </Menu>

      <AddGroupModal open={openAddGroupModal} setOpen={setOpenAddGroupModal} />
      <EditGroupModal
        open={openEditGroupModal}
        setOpen={setOpenEditGroupModal}
      />
      <DeleteGroupModal
        open={openDeleteGroupModal}
        setOpen={setOpenDeleteGroupModal}
      />
    </>
  );
}
