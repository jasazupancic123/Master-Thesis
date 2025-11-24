'use client';

import {
  alpha,
  Box,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import DashboardPageContainer from './dashboard-page-container';
import { useDashboard } from '@/store/dashboard.provider';
import { theme } from '@/app/style';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import { MAX_WIDTH_DASHBOARD_ITEM } from '../trainer-group-day-view/constant/dimensions.constant';
import { useEffect, useState } from 'react';
import DashboardGroupCard from './dashboard-group-card';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import DashboardInstitutionMember from './dashboard-institution-member';
import { SortableContext } from '@dnd-kit/sortable';
import { Group } from '@/core/group/type/group.type';
import toast from 'react-hot-toast';
import { useScreenSize } from '@/store/screen-size.provider';
import { lib } from '@/lib';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import AddButton from '@/ui/add-button';
import RegisterUsersDashboardModal from './modals/dashboard-register-users-modal';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import { FileUploadOutlined } from '@mui/icons-material';
import MyModal from '@/ui/modal';
import FileUpload from '@/ui/file-upload';
import useInstitutionMembers from './hooks/use-institution-members.hook';
import { InputType } from '@/lib/common/const/input-type.const';
import { useMain } from '@/store/main.provider';
import { AuthUser } from '@/core/auth/type/user.type';

export default function DashboardMembers() {
  const screenSize = useScreenSize();
  const { role } = useAuthenticatedAuth();

  const { users } = useMain();
  const { selectedInstitution, selectedGroups, addGroupMember, updateGroup } =
    useDashboard();

  const { uploadUsers, setIsUploadingMembers, isUploadingMembers } =
    useInstitutionMembers();

  const [search, setSearch] = useState('');

  const [allInstitutionMembers, setAllInstitutionMembers] = useState(
    (selectedInstitution?.trainers || []).concat(
      selectedInstitution?.athletes || []
    )
  );

  useEffect(() => {
    if (!selectedInstitution || !csvUserEmails.length) return;

    const newUsers = [] as AuthUser[];
    for (const email of csvUserEmails) {
      if (!email) continue;

      const user = users.find((user) => user.email === email.toLowerCase());
      if (!user) continue;
      newUsers.push(user);
    }

    const athletes = newUsers
      .filter((user) => user.customClaims.role.includes(UserRole.ATHLETE))
      .filter((user) => !selectedInstitution?.athleteIds?.includes(user.uid));

    const trainers = newUsers
      .filter((user) => user.customClaims.role.includes(UserRole.TRAINER))
      .filter((user) => !selectedInstitution?.trainerIds?.includes(user.uid));

    if (!trainers.length && !athletes.length) {
      toast.error('No new users to add');

      setCsvUserEmails([]);
      setIsUploadingMembers(false);
      return;
    }

    toast.success('Successfully added users');
    setCsvUserEmails([]);
    setIsUploadingMembers(false);
  }, [users]);

  useEffect(() => {
    setAllInstitutionMembers(
      (selectedInstitution?.trainers || []).concat(
        selectedInstitution?.athletes || []
      )
    );
  }, [selectedInstitution]);

  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [filteredMembers, setFilteredMembers] = useState(allInstitutionMembers);

  const [hoveredUser, setHoveredUser] = useState<{
    userId: string | null;
    groupId: string | null;
  }>({ userId: null, groupId: null });
  const [csvUserEmails, setCsvUserEmails] = useState<string[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [openRegisterAthletesModal, setOpenRegisterAthletesModal] =
    useState(false);
  const [openRegisterTrainersModal, setOpenRegisterTrainersModal] =
    useState(false);
  const [openAddMemberViaCsvModal, setOpenAddMemberViaCsvModal] =
    useState(false);

  useEffect(() => {
    const normalizedSearch = search.trim().toLowerCase();

    setFilteredMembers(
      allInstitutionMembers.filter((member) => {
        const name = (member.displayName ?? '').toLowerCase();
        return name.includes(normalizedSearch);
      })
    );
  }, [allInstitutionMembers, search]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 5 } })
  );

  const onUserDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    setActiveMemberId(event.active.id as string);
  };

  const onUserDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);

    const { active, over } = event;

    const userId = active.id as string;
    const groupId = over?.id as string;

    if (!groupId) return;

    const user = allInstitutionMembers.find((u) => u.uid === userId);
    const group = selectedGroups.find((g) => g.id === groupId);

    if (!user || !group) return;

    const isMemberInGroup = group.trainerIds
      .concat(group.membersIds)
      .includes(user.uid);

    if (isMemberInGroup) {
      toast.error(`${user.displayName} is already in ${group.name}`);
      setActiveMemberId(null);
      return;
    }

    const isTrainer = selectedInstitution?.trainers.some(
      (t) => t.uid === user.uid
    );

    if (isTrainer) {
      const updatedGroup: Group = {
        ...group,
        trainerIds: [group.trainerIds, user.uid].flat(),
      };

      await updateGroup(updatedGroup.id, updatedGroup);

      toast.success('Trainer added successfully to group');
      return;
    }

    await addGroupMember(user, groupId);

    toast.success('User added successfully to group');

    setActiveMemberId(null);
  };

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
          display="flex"
          flexDirection="column"
          sx={{
            py: 1,
            px: 2,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.background.dark} 0%, ${alpha(theme.palette.background.light, 0.5)} 100%, ${theme.palette.background.light} 100%)`,
            mx: 'auto',
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
            maxWidth={MAX_WIDTH_DASHBOARD_ITEM}
            display="flex"
            alignItems="flex-start"
            sx={{
              overflowX: 'auto',
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

            const athletes = authUsers.filter((user) =>
              user.customClaims.role.includes(UserRole.ATHLETE)
            );

            const trainers = authUsers.filter((user) =>
              user.customClaims.role.includes(UserRole.TRAINER)
            );
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
