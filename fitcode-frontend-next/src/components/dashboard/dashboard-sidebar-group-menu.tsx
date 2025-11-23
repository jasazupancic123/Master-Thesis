import { Group } from '@/core/group/type/group.type';
import { lib } from '@/lib';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { Add, Edit, Delete } from '@mui/icons-material';
import {
  Menu,
  Box,
  Typography,
  MenuItem,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { RefObject, useEffect, useState } from 'react';
import EditGroupModal from './modals/edit-group-modal';
import AddGroupModal from './modals/add-group-modal';
import DeleteGroupModal from './modals/delete-group-modal';
import { SetState } from '@/lib/common/type/state.type';

interface Props {
  achorElRef: RefObject<HTMLDivElement | null>;
  openGroupsMenu: boolean;
  setOpenGroupsMenu: SetState<boolean>;
}

export default function DashboardSidebarGroupMenu(props: Props) {
  const { role } = useAuthenticatedAuth();
  const { groups } = useMain();
  const { selectedInstitution, selectedGroup, setSelectedGroup } =
    useDashboard();

  const { achorElRef, openGroupsMenu, setOpenGroupsMenu } = props;

  const [institutionAndTrainerGroups, setInstitutionAndTrainerGroups] =
    useState<Group[]>([]);

  const [openAddGroupModal, setOpenAddGroupModal] = useState(false);
  const [openEditGroupModal, setOpenEditGroupModal] = useState(false);
  const [openDeleteGroupModal, setOpenDeleteGroupModal] = useState(false);

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
        sx={{ top: !selectedGroup ? 20 : 48 }}
      >
        {/* Actions row */}
        <Box display="flex" gap={0.5}>
          {!institutionAndTrainerGroups.length ? (
            <Typography sx={{ px: 1 }}>No groups</Typography>
          ) : (
            <Box display="flex" flexDirection="column" sx={{ maxHeight: 300 }}>
              {institutionAndTrainerGroups
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((group: Group) => {
                  return (
                    <MenuItem
                      key={group.id}
                      value={group.id}
                      onClick={() => {
                        setSelectedGroup(group);
                        setOpenGroupsMenu(false);
                      }}
                    >
                      <Typography>{group.name}</Typography>
                    </MenuItem>
                  );
                })}
            </Box>
          )}
          <Divider orientation="vertical" flexItem />
          <Box display="flex" flexDirection="column" sx={{ px: 0.5 }} gap={1}>
            {groupActions.map((action) => (
              <Tooltip
                key={action.title}
                title={action.title}
                arrow
                placement="right"
              >
                <IconButton
                  size="small"
                  onClick={() => {
                    action.onClick();
                  }}
                  sx={{
                    p: 0,
                    m: 0,
                  }}
                >
                  {action.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
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
