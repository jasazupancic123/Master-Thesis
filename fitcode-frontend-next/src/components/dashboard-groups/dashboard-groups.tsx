'use client';

import { MoreVert } from '@mui/icons-material';
import { IconButton, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import DashboardGroupsMembers from '../dashboard-groups-members/dashboard-groups-members';
import HorizontalItemsList from '../horizontal-items-list/horizontal-items-list';
import { MAX_WIDTH } from '../trainer-day-view/constant';
import { ADD_GROUP } from '@/common/constant/add-group.constant';
import { isManager } from '@/common/firebase/firebase-auth.util';
import type { SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { GroupService } from '@/controller/group/group.service';
import type { Cycle } from '@/controller/group/type/cycle.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { useAuthenticatedAuth, withAuth } from '@/store/auth-provider';
import { useDashboard } from '@/store/dashboard-provider';
import { useMain } from '@/store/main-provider';
import { useScreenSize } from '@/store/screen-size-provider';

interface DashboardGroupsProps {
  modal: {
    add_member: boolean;
    add_trainer: boolean;
    add_group: boolean;
    add_member_via_csv: boolean;
    edit_athlete: boolean;
  };
  setModal: SetState<{
    add_member: boolean;
    add_trainer: boolean;
    add_group: boolean;
    add_member_via_csv: boolean;
    edit_athlete: boolean;
  }>;
}

function DashboardGroups(props: DashboardGroupsProps) {
  const { modal, setModal } = props;

  const screenSize = useScreenSize();
  const theme = useTheme();
  const { users } = useMain();
  const { role, token } = useAuthenticatedAuth();
  const controller = GroupController.getInstance(token);
  const { selectedInstitution, selectedGroup, setSelectedGroup } =
    useDashboard();

  const [_selectedCycle, setSelectedCycle] = useState<Cycle | null>(
    selectedGroup?.cycles[0] || null
  );

  const scrollHorizontalListLeftRef = useRef(0);

  useEffect(() => {
    async function fetchGroups() {
      if (!selectedInstitution || selectedInstitution.groups) return;
      selectedInstitution.groups = await controller.findAllByInstitution(
        selectedInstitution.id
      );

      if (
        !selectedInstitution.groups ||
        !selectedInstitution.groups.length ||
        (selectedGroup &&
          !selectedInstitution.groups
            .map((g) => g.id)
            .includes(selectedGroup?.id))
      ) {
        setSelectedGroup(null);
        setSelectedCycle(null);
      }
    }

    fetchGroups().then();
  }, [selectedInstitution]);

  if (!selectedInstitution) return null;

  const HorizontalInput = () => {
    return (
      <HorizontalItemsList
        dashboardView
        addButtonOnEnd={isManager(role)}
        onButtonClick={() => {
          setModal((prev) => ({ ...prev, add_group: true }));
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
            setModal((prev) => ({ ...prev, add_group: true }));
            return;
          }

          const group = selectedInstitution?.groups?.find(
            (g) => g.id === value
          );

          if (group) {
            const mapped = GroupService.mapMembers(group, users);
            setSelectedGroup(mapped);
            setSelectedCycle(group.cycles[0] || null);
          } else {
            setSelectedGroup(null);
            setSelectedCycle(null);
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
                sx={{
                  textTransform: 'uppercase',
                }}
              >
                {selectedGroup?.name || 'Select A Group'}
              </Typography>
              <IconButton
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  zIndex: 1,
                }}
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
            sx={{
              mt: 1,
            }}
          >
            <Box
              sx={{
                height: 16,
                width: 4,
                borderRadius: 5,
                backgroundColor: theme.palette.primary.main,
                ml: !screenSize.isDesktop ? 1 : 0,
              }}
            />

            <Typography
              fontWeight={600}
              fontSize={16}
              sx={{
                textTransform: 'uppercase',
              }}
            >
              {selectedGroup?.name || 'Select A Group'}
            </Typography>
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

      <DashboardGroupsMembers modal={modal} setModal={setModal} />
    </Box>
  );
}

export default withAuth(DashboardGroups, [
  UserRole.TRAINER,
  UserRole.MANAGER,
  UserRole.ADMIN,
]);
