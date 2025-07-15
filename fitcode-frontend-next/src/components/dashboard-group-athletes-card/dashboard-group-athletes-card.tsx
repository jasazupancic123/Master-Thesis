import { AddMembersModal } from '@/components/add-members-modal/add-members-modal';
import BorderColor from '@/components/border-color/border-color';
import MyModal from '@/components/modal/modal';
import { Group } from '@/controller/group/type/group.type';
import { User } from '@/controller/user/type/user.type';
import { Close, PersonAddAlt, Remove } from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useScreenSize } from '@/store/screen-size-provider';
import { useDashboard } from '@/store/dashboard-provider';
import { handleApiRequest, SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { isManager, isTrainer } from '@/common/service/util/firebase-auth.util';

interface GroupAthletesCardProps {
  group: Group;
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
}

export default function GroupAthletesCard(props: GroupAthletesCardProps) {
  const { group, selectedUser, setSelectedUser } = props;

  const screenSize = useScreenSize();
  const router = useRouter();
  const {
    profile,
    selectedGroup,
    setSelectedGroup,
    selectedInstitution,
    setSelectedInstitution,
    users,
    setDetectedChanges,
  } = useDashboard();

  const role = profile?.customClaims?.role || [];

  const [groupMembers, setGroupMembers] = useState<User[]>(group.members || []);

  const [modal, setModal] = useState<{
    add_member: boolean;
    remove_group: boolean;
  }>({
    add_member: false,
    remove_group: false,
  });

  useEffect(() => {
    setGroupMembers(
      (users || []).filter((user) => group.membersIds.includes(user.uid))
    );
  }, [users]);

  useEffect(() => {
    if (!selectedGroup) return;
    if (selectedGroup.id === group.id) {
      setGroupMembers(
        (users || []).filter((user) => group.membersIds.includes(user.uid)) // show all users
      );
    } else {
      setGroupMembers(
        (users || [])
          .filter((user) => group.membersIds.includes(user.uid))
          .splice(0, 7) // only show first 7 users
      );
    }
  }, [selectedGroup]);

  const handleRemoveGroup = () => {
    handleApiRequest(
      router,
      () => GroupController.delete(group.id),
      () => {
        setSelectedGroup(null);
        setSelectedInstitution((prev) => {
          if (!prev) return null;
          const updatedGroups = prev.groups.filter((g) => g.id !== group.id);
          return { ...prev, groups: updatedGroups };
        });
        toast.success('Successfully deleted group');
      },
      undefined,
      'Failed to delete group'
    );
  };

  return (
    <Box
      key={group.id}
      display="flex"
      flexDirection="column"
      width="100%"
      sx={{
        borderTopRightRadius: '10px',
        borderTopLeftRadius: '10px',
        backgroundColor: 'background.paper',
      }}
    >
      <Box
        key={`${group.id}-child`}
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{
          borderTopRightRadius: '10px',
          borderTopLeftRadius: '10px',
          py: 1,
          backgroundColor: 'primary.dark',
          textAlign: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={() => setSelectedGroup(group)}
      >
        {isManager(role) && (
          <Tooltip title="Remove group" placement="top">
            <IconButton
              onClick={() =>
                setModal((prev) => ({ ...prev, remove_group: true }))
              }
              sx={{
                m: 0,
                p: 0,
                position: 'absolute',
                top: 10,
                left: screenSize.isTablet ? 5 : 10,
              }}
            >
              <Remove />
            </IconButton>
          </Tooltip>
        )}
        {(isManager(role) || isTrainer(role)) && (
          <Tooltip title="Add athlete" placement="top">
            <IconButton
              onClick={() =>
                setModal((prev) => ({ ...prev, add_member: true }))
              }
              sx={{
                m: 0,
                p: 0,
                position: 'absolute',
                top: 10,
                right: screenSize.isTablet ? 5 : 10,
              }}
            >
              <PersonAddAlt />
            </IconButton>
          </Tooltip>
        )}

        <Typography
          variant="h6"
          sx={{ fontSize: 18, maxWidth: screenSize.isTablet ? '50%' : '75%' }}
        >
          {group.name}
        </Typography>
      </Box>

      {groupMembers.map((member, i) => (
        <Box key={member.uid} alignItems="center" position="relative">
          <Typography
            key={member.uid}
            variant="body1"
            onClick={() => {
              if (selectedUser?.uid === member.uid) {
                setSelectedUser(null);
                return;
              }
              setSelectedGroup(group);
              setSelectedUser(member);
            }}
            sx={{
              textAlign: 'center',
              width: '100%',
              py: 1,
              cursor: 'pointer',
              backgroundColor:
                selectedGroup === group && selectedUser === member
                  ? 'primary.light'
                  : undefined,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              px: 4,
            }}
          >
            {member.displayName}
          </Typography>

          {(isManager(role) || isTrainer(role)) && (
            <IconButton
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
              }}
              onClick={() => {
                if (selectedUser?.uid === member.uid) {
                  setSelectedUser(null);
                }
                setGroupMembers((prev) =>
                  prev.filter((m) => m.uid !== member.uid)
                );
                setSelectedInstitution((prev) => {
                  if (!prev) return null;
                  const updatedGroups = prev.groups.map((g) => {
                    if (g.id === group.id) {
                      return {
                        ...g,
                        membersIds: g.membersIds.filter(
                          (uid) => uid !== member.uid
                        ),
                      };
                    }
                    return g;
                  });
                  return {
                    ...prev,
                    groups: updatedGroups,
                  };
                });
                setDetectedChanges(true);
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>
      ))}

      <BorderColor
        lower
        color={selectedGroup === group ? 'primary.main' : 'primary.dark'}
      />
      <MyModal
        isOpen={modal.add_member}
        setIsOpen={(open) =>
          setModal((prev) => ({ ...prev, add_member: open }))
        }
        onCancel={() => setModal((prev) => ({ ...prev, add_member: false }))}
        cancelText="Close"
      >
        <AddMembersModal
          users={selectedInstitution?.athletes || []}
          members={groupMembers}
          setMembers={setGroupMembers}
          setSelectedInstitution={setSelectedInstitution}
          addUserToEnd={true}
          dashboardView={true}
          group={group}
          selectedInstitution={selectedInstitution}
          enableFirstShowUsers
          enableScroll
        />
      </MyModal>
      <MyModal
        isOpen={modal.remove_group}
        setIsOpen={(open) =>
          setModal((prev) => ({ ...prev, remove_group: open }))
        }
        onCancel={() => setModal((prev) => ({ ...prev, remove_group: false }))}
        onConfirm={handleRemoveGroup}
        cancelText="Close"
      >
        {`Remove group ${group.name}?`}
      </MyModal>
    </Box>
  );
}
