'use client';

import { MoreVert } from '@mui/icons-material';
import { IconButton, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/material';
import { useRef, useState } from 'react';

import AddGroupModal from './dashboard-add-group-modal';
import DashboardGroupsMembers from './dashboard-groups-members';
import { MAX_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { app } from '@/core/app.service';
import { ADD_GROUP } from '@/core/group/const/add-group.const';
import { lib } from '@/lib';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import EditableTextField from '@/util/editable-text-field';
import HorizontalItemsList from '@/util/horizontal-items-list';
import SimpleCircle from '@/util/simple-circle';

export default function DashboardGroups() {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const { role } = useAuthenticatedAuth();
  const { users } = useMain();
  const { selectedInstitution, selectedGroup, setSelectedGroup, updateGroup } =
    useDashboard();

  const [openAddGroupModal, setOpenAddGroupModal] = useState(false);
  const scrollHorizontalListLeftRef = useRef(0);

  if (!selectedInstitution) return null;

  const HorizontalInput = () => {
    return (
      <HorizontalItemsList
        dashboardView
        addButtonOnEnd={lib.firebase.auth.isManager(role)}
        onButtonClick={() => {
          setOpenAddGroupModal(true);
        }}
        items={
          (selectedInstitution?.groups || []).map((group) => ({
            label: group.name,
            value: group.id,
          })) || []
        }
        scrollHorizontalListLeftRef={scrollHorizontalListLeftRef}
        value={selectedGroup?.id || ''}
        setValue={(value) => {
          if (value === ADD_GROUP.id) {
            setOpenAddGroupModal(true);
            return;
          }

          const group = selectedInstitution?.groups?.find(
            (g) => g.id === value
          );

          if (group) {
            const mapped = app.group.mapMembers(group, users);
            setSelectedGroup(mapped);
          } else {
            setSelectedGroup(null);
          }
        }}
        checkIsSameValue={(value: string) => {
          return selectedGroup?.id === value;
        }}
        onArrowClick={() => {}}
      />
    );
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      width="100%"
      maxWidth={MAX_WIDTH}
      gap={screenSize.isSmallTablet || screenSize.isMobile ? 0 : 5}
      sx={{
        backgroundColor: theme.palette.background.default,
        mx: 'auto',
      }}
    >
      {screenSize.isSmallTablet || screenSize.isMobile ? (
        <>
          <HorizontalInput />
          <Box width="100%" sx={{ position: 'relative' }}>
            <Box
              width="80%"
              display="flex"
              justifyContent="center"
              alignItems="center"
              mt={1}
              sx={{ mx: 'auto', mb: 1 }}
            >
              <Typography
                fontWeight={600}
                fontSize={16}
                textAlign="center"
                sx={{ textTransform: 'uppercase' }}
              >
                {selectedGroup?.name || 'Select A Group'}
              </Typography>

              <IconButton
                sx={{ position: 'absolute', right: 0, top: 0, zIndex: 1 }}
              >
                <MoreVert fontSize="medium" />
              </IconButton>
            </Box>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          width="100%"
          justifyContent="space-around"
          alignItems="flex-start"
        >
          <Box
            width="25%"
            display="flex"
            justifyContent="flex-start"
            alignItems="center"
            gap={1}
            sx={{ mt: 1 }}
          >
            <SimpleCircle />

            {selectedGroup && (
              <EditableTextField
                value={selectedGroup.name}
                onChange={async (name) =>
                  await updateGroup(selectedGroup.id, { name })
                }
              />
            )}
          </Box>

          <Box width="50%">
            <HorizontalInput />
          </Box>

          <Box width="25%" display="flex" justifyContent="flex-end" mt={1}>
            <IconButton sx={{ m: 0, p: 0 }}>
              <MoreVert fontSize="large" />
            </IconButton>
          </Box>
        </Box>
      )}

      <DashboardGroupsMembers />

      <AddGroupModal open={openAddGroupModal} setOpen={setOpenAddGroupModal} />
    </Box>
  );
}
