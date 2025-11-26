'use client';

import {
  closestCenter,
  DndContext,
  DragOverlay,
  pointerWithin,
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import {
  FileUploadOutlined,
  KeyboardArrowDownOutlined,
  KeyboardArrowRightOutlined,
} from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Grid2,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

import DashboardPageContainer from '../dashboard/dashboard-page-container';
import useInstitutionMembers from '../dashboard/hooks/use-institution-members.hook';
import EditAthleteModal from '../dashboard/modals/edit-athlete-modal';
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
import { LINEAR_GRADIENT_BG } from '@/lib/common/const/ui.const';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import AddButton from '@/ui/add-button';
import FileUpload from '@/ui/file-upload';
import MyModal from '@/ui/modal';

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
    includeTrainers,
    setIncludeTrainers,
    includeAthletes,
    setIncludeAthletes,
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

  const [wrapInstitutionMembers, setWrapInstitutionMembers] = useState(false);
  const [openEditAthleteModal, setOpenEditAthleteModal] = useState(false);

  if (!selectedInstitution) return null;

  return (
    <DashboardPageContainer>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
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
            flexDirection={screenSize.isMobile ? 'column' : 'row'}
            justifyContent="flex-start"
            alignItems={screenSize.isMobile ? 'flex-start' : 'center'}
            gap={screenSize.isMobile ? 1 : 2}
          >
            <Box
              display="flex"
              justifyContent="flex-start"
              alignItems="center"
              gap={0.5}
            >
              <Image
                src={selectedInstitution.imageUrl}
                alt="Institution"
                unoptimized={lib.common.env.unoptimizeImages()}
                width={24}
                height={0}
                layout="intrinsic"
                style={{ objectFit: 'cover' }}
              />
              <Typography lineHeight={1} variant="h6" mt={0.3}>
                Members
              </Typography>
            </Box>
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
                <IconButton
                  onClick={() => {
                    setIncludeTrainers((prev) => !prev);
                  }}
                  sx={{ p: 0, m: 0 }}
                >
                  <Typography
                    width={20}
                    height={20}
                    variant="caption"
                    fontWeight={600}
                    fontSize={12}
                    sx={{
                      borderRadius: '50%',
                      backgroundColor: !includeTrainers
                        ? theme.palette.action.focus
                        : theme.palette.primary.main,
                      color: !includeTrainers
                        ? theme.palette.text.primary
                        : theme.palette.text.secondary,
                    }}
                  >
                    T
                  </Typography>
                </IconButton>

                <IconButton
                  onClick={() => {
                    setIncludeAthletes((prev) => !prev);
                  }}
                  sx={{ p: 0, m: 0 }}
                >
                  <Typography
                    width={20}
                    height={20}
                    variant="caption"
                    fontWeight={600}
                    fontSize={12}
                    sx={{
                      borderRadius: '50%',
                      backgroundColor: !includeAthletes
                        ? theme.palette.action.focus
                        : theme.palette.primary.main,
                      color: !includeAthletes
                        ? theme.palette.text.primary
                        : theme.palette.text.secondary,
                    }}
                  >
                    A
                  </Typography>
                </IconButton>
              </Box>
            )}
          </Box>
          <Box
            width="100%"
            display="flex"
            alignItems="flex-start"
            flexWrap={wrapInstitutionMembers ? 'wrap' : undefined}
            sx={{
              mx: 'auto',
              overflowX: 'visible',
              overflowY: 'hidden',
              pb: 1,
              pl: 2,
              ...styledScrollbarSx(theme),
              position: 'relative',
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
                    isDragging={isDragging}
                  />
                ))
              )}
            </SortableContext>
            <IconButton
              onClick={() => setWrapInstitutionMembers((prev) => !prev)}
              sx={{ position: 'absolute', top: -3, left: 0, p: 0, m: 0 }}
            >
              {!wrapInstitutionMembers ? (
                <KeyboardArrowRightOutlined fontSize="small" />
              ) : (
                <KeyboardArrowDownOutlined fontSize="small" />
              )}
            </IconButton>
          </Box>
        </Box>

        {!selectedGroups.length ? (
          <Typography>No groups</Typography>
        ) : (
          <Grid2
            container
            spacing={2}
            justifyContent={
              selectedGroups.length === 1 ? 'center' : 'flex-start'
            }
            alignItems="flex-start"
            width="100%"
          >
            {selectedGroups
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((g) => (
                <Grid2
                  key={g.id}
                  size={
                    selectedGroups.length === 1
                      ? {
                          xs: 12,
                          sm: 12,
                          md: 12,
                          lg: 12,
                        }
                      : {
                          xs: 12,
                          sm: 6,
                          md: 6,
                          lg: 4,
                        }
                  }
                  display="flex"
                  justifyContent="center"
                >
                  <DashboardGroupCard
                    group={g}
                    hoveredUser={hoveredUser}
                    setHoveredUser={setHoveredUser}
                    isDragging={isDragging}
                    setOpenEditAthleteModal={setOpenEditAthleteModal}
                  />
                </Grid2>
              ))}
          </Grid2>
        )}

        <DragOverlay style={{ cursor: 'grab' }}>
          {activeMemberId ? (
            <DashboardInstitutionMember
              member={filteredMembers.find((m) => m.uid === activeMemberId)!}
              isBeingDragged
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <EditAthleteModal
        open={openEditAthleteModal}
        setOpen={setOpenEditAthleteModal}
      />

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
