'use client';

import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { FileUploadOutlined } from '@mui/icons-material';
import {
  alpha,
  Box,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import DashboardPageContainer from '../dashboard/dashboard-page-container';
import useInstitutionMembers from '../dashboard/hooks/use-institution-members.hook';
import { MAX_WIDTH_DASHBOARD_ITEM } from '../trainer-group-day-view/constant/dimensions.constant';
import DashboardGroupCard from './dashboard-group-card';
import DashboardInstitutionMember from './dashboard-institution-member';
import useCsvMembersUpload from './hooks/use-csv-members-upload.hook';
import useDashboardMembers from './hooks/use-members.hook';
import useDashboardMembersDrag from './hooks/use-members-drag.hook';
import RegisterUsersDashboardModal from './modals/dashboard-register-users-modal';
import { theme } from '@/app/style';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import { lib } from '@/lib';
import { InputType } from '@/lib/common/const/input-type.const';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import AddButton from '@/ui/add-button';
import FileUpload from '@/ui/file-upload';
import MyModal from '@/ui/modal';
import { LINEAR_GRADIENT_BG } from '@/lib/common/const/ui.const';

export default function DashboardMembers() {
  const screenSize = useScreenSize();
  const { role } = useAuthenticatedAuth();

  const { selectedInstitution, selectedGroups } = useDashboard();

  const { uploadUsers, setIsUploadingMembers, isUploadingMembers } =
    useInstitutionMembers();

  const { setCsvUserEmails } = useCsvMembersUpload();

  const {
    search,
    setSearch,
    filteredMembers,
    allInstitutionMembers,
    hoveredUser,
    setHoveredUser,
    openRegisterAthletesModal,
    setOpenRegisterAthletesModal,
    openRegisterTrainersModal,
    setOpenRegisterTrainersModal,
    openAddMemberViaCsvModal,
    setOpenAddMemberViaCsvModal,
  } = useDashboardMembers();

  const {
    onUserDragStart,
    onUserDragEnd,
    sensors,
    activeMemberId,
    isDragging,
  } = useDashboardMembersDrag(allInstitutionMembers);

  if (!selectedInstitution) return null;

  return (
    <DashboardPageContainer>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onUserDragEnd}
        onDragStart={onUserDragStart}
      >
        <Box
          width="100%"
          maxWidth={MAX_WIDTH_DASHBOARD_ITEM}
          display="flex"
          flexDirection="column"
          sx={{
            py: 1,
            px: 2,
            borderRadius: 2,
            background: LINEAR_GRADIENT_BG,
            overflowX: 'hidden',
          }}
          gap={2}
        >
          <Box
            width="100%"
            display="flex"
            justifyContent="flex-start"
            alignItems="center"
            gap={2}
          >
            <Typography variant="h6">Members</Typography>
            <TextField
              size="small"
              label="Search members"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {lib.firebase.auth.isManager(role) && (
              <Box display="flex" alignItems="center" gap={1}>
                <AddButton
                  onClick={() => setOpenRegisterAthletesModal(true)}
                  tooltip="Register athletes"
                />
                <AddButton
                  onClick={() => setOpenRegisterTrainersModal(true)}
                  tooltip="Register trainers"
                />
                <Tooltip title="Upload Members via CSV">
                  <IconButton
                    sx={{
                      m: 0,
                      p: 0.5,
                      backgroundColor: theme.palette.background.light,
                      borderRadius: 1,
                    }}
                    onClick={() => setOpenAddMemberViaCsvModal(true)}
                  >
                    <FileUploadOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
          <Box
            width="100%"
            display="flex"
            alignItems="flex-start"
            sx={{
              mx: 'auto',
              overflowX: 'visible',
              overflowY: 'hidden',
              pb: 1,
              ...styledScrollbarSx(theme),
            }}
            gap={3}
          >
            <SortableContext items={filteredMembers.map((m) => m.uid)}>
              {filteredMembers.length === 0 ? (
                <Typography>No members</Typography>
              ) : (
                filteredMembers.map((member) => (
                  <DashboardInstitutionMember
                    key={member.uid}
                    member={member}
                  />
                ))
              )}
            </SortableContext>
          </Box>
        </Box>

        <Box
          width="100%"
          display="flex"
          flexWrap="wrap"
          justifyContent={
            selectedGroups.length === 1
              ? 'center'
              : screenSize.isMobile || screenSize.isTablet
                ? 'space-around'
                : 'space-between'
          }
          alignItems="flex-start"
          gap={2}
        >
          {!selectedGroups.length ? (
            <Typography>No groups</Typography>
          ) : (
            selectedGroups
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((g) => (
                <DashboardGroupCard
                  key={g.id}
                  group={g}
                  hoveredUser={hoveredUser}
                  setHoveredUser={setHoveredUser}
                  isDragging={isDragging}
                />
              ))
          )}
        </Box>

        <DragOverlay style={{ cursor: 'grab' }}>
          {activeMemberId ? (
            <DashboardInstitutionMember
              member={filteredMembers.find((m) => m.uid === activeMemberId)!}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <RegisterUsersDashboardModal
        open={openRegisterAthletesModal}
        setOpen={setOpenRegisterAthletesModal}
        registerRole={UserRole.ATHLETE}
      />

      <RegisterUsersDashboardModal
        open={openRegisterTrainersModal}
        setOpen={setOpenRegisterTrainersModal}
        registerRole={UserRole.TRAINER}
      />

      <MyModal
        isOpen={openAddMemberViaCsvModal}
        setIsOpen={(open) => setOpenAddMemberViaCsvModal(open)}
        onConfirm={undefined}
        onCancel={() => setOpenAddMemberViaCsvModal(false)}
        cancelText="Close"
      >
        <FileUpload
          label="CSV of users"
          input={InputType.CSV}
          onFileUpload={async (file) => {
            setIsUploadingMembers(true);

            const authUsers = await uploadUsers(file);

            setOpenAddMemberViaCsvModal(false);
            setCsvUserEmails(authUsers.map((d) => d.email!));
          }}
        />
      </MyModal>

      {isUploadingMembers && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100vw"
          height="100vh"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          gap={2}
          sx={{ zIndex: 130000, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        >
          <CircularProgress size={24} />
          <Typography fontSize={20}>Registering...</Typography>
        </Box>
      )}
    </DashboardPageContainer>
  );
}
