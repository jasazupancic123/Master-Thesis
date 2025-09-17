import {
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import Box from '@mui/material/Box';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { SearchBar } from '../search-bar/search-bar';
import { theme } from '@/app/style';
import { handleApiRequest, type SetState } from '@/common/type/state.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import { GroupController } from '@/controller/group/group.controller';
import type { Group } from '@/controller/group/type/group.type';
import type { Institution } from '@/controller/institution/type/institution.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';

export type AddMembersModalProps = {
  title?: string;
  placeholder?: string;
  users: AuthUser[];
  members: AuthUser[];
  setMembers: SetState<AuthUser[]> | ((members: AuthUser[]) => void);
  addUserToEnd: boolean;
  dissableMaxWidth?: boolean;
  dashboardView?: boolean;
  group?: Group | null;
  selectedInstitution?: Institution | null;
  setSelectedInstitution?: SetState<Institution | null>;
  singleMember?: AuthUser | null; // for single member selection
  setSingleMember?: SetState<AuthUser | null>; // for single member selection
  enableFirstShowUsers?: boolean; // to show first 5 users when search is empty
  enableScroll?: boolean; // to enable scroll in the modal
};

export function AddMembersModal(props: AddMembersModalProps) {
  const router = useRouter();
  const {
    users,
    members,
    setMembers,
    title,
    placeholder,
    dissableMaxWidth,
    dashboardView,
    group,
    selectedInstitution,
    setSelectedInstitution,
    singleMember,
    setSingleMember,
    enableFirstShowUsers,
    enableScroll,
  } = props;
  const { setDetectedChanges } = useDashboard();
  const { token } = useAuthenticatedAuth();
  const controller = GroupController.getInstance(token);

  const [searchQueryAddPlayer, setSearchQueryAddPlayer] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[] | null>(null);

  const handleAddMember = async (user: AuthUser) => {
    if (members.some((m) => m.uid === user.uid)) return;

    const updatedMembers = props.addUserToEnd
      ? [...members, user]
      : [user, ...members];

    await handleApiRequest(
      router,
      () => controller.addMember(group!.id, { userId: user.uid }),
      () => {
        toast.success('Member added successfully');
      },
      (e) => {
        toast.error((e as Error).message);
      }
    );

    if (dashboardView) {
      setDetectedChanges(true);
      if (setSelectedInstitution && group) {
        const newGroup = selectedInstitution?.groups.find(
          (g) => g.id === group.id
        );
        if (!newGroup) return;

        setSelectedInstitution((prev) => {
          if (!prev) return null;
          const updatedGroups = prev.groups.map((g: Group) =>
            g.id === newGroup.id
              ? { ...g, membersIds: updatedMembers.map((m) => m.uid) }
              : g
          );

          return { ...prev, groups: updatedGroups };
        });
      }
    }
    setMembers(updatedMembers);
  };

  const handleRemoveMember = async (user: AuthUser) => {
    if (setSingleMember) {
      setSingleMember(null);
      return;
    }

    await handleApiRequest(
      router,
      () => controller.removeMember(group!.id, { userId: user.uid }),
      () => {
        toast.success('Member removed successfully');
      },
      (e) => {
        toast.error((e as Error).message);
      }
    );

    const updatedMembers = members.filter((m) => m.uid !== user.uid);
    setMembers(updatedMembers);

    if (dashboardView) {
      setDetectedChanges(true);
      if (setSelectedInstitution && group) {
        const newGroup = selectedInstitution?.groups.find(
          (g) => g.id === group.id
        );
        if (!newGroup) return;

        setSelectedInstitution((prev) => {
          if (!prev) return null;
          const updatedGroups = prev.groups.map((g: Group) =>
            g.id === newGroup.id
              ? {
                  ...g,
                  membersIds: updatedMembers.map((m) => m.uid),
                }
              : g
          );
          return { ...prev, groups: updatedGroups };
        });
      }
    }
  };

  const handleChangeMember = (user: AuthUser) => {
    if (!setSingleMember) return;
    setSingleMember(user);
  };

  const isUserIncluded = (user: AuthUser) => {
    if (setSingleMember) {
      return user.uid === singleMember?.uid;
    }
    return members.some((m) => m.uid === user.uid);
  };

  useEffect(() => {
    let filteredUsers = users.filter(
      (user) =>
        user.email
          ?.toLowerCase()
          .includes(searchQueryAddPlayer.toLowerCase()) ||
        user.displayName
          ?.toLowerCase()
          .includes(searchQueryAddPlayer.toLowerCase())
    );

    if (!enableScroll) {
      filteredUsers.length = 5; // limit to 5
    }
    filteredUsers = filteredUsers.filter(
      (user, index, self) => index === self.findIndex((t) => t.uid === user.uid)
    );

    setFilteredUsers(filteredUsers);
  }, [searchQueryAddPlayer]);

  return (
    <>
      <Box display="flex" justifyContent="center" alignItems="center" p={1}>
        <Typography variant="h6">{title || 'Add Members'}</Typography>
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        minWidth={dissableMaxWidth ? undefined : 300}
      >
        <Box display="flex" justifyContent="center" alignItems="center" p={1}>
          <SearchBar
            placeholder={placeholder || 'Search Users'}
            value={searchQueryAddPlayer}
            handleSearchChange={(e) => setSearchQueryAddPlayer(e.target.value)}
            maxWidth={'85%'}
          />
        </Box>
        <Box>
          <List
            sx={{
              maxHeight: enableScroll ? 300 : undefined,
              overflowY: enableScroll ? 'auto' : undefined,
            }}
          >
            {searchQueryAddPlayer.length > 0 && filteredUsers?.length === 0 ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                p={2}
              >
                <Typography variant="body2">No Users Found</Typography>
              </Box>
            ) : (
              (searchQueryAddPlayer.length > 0 || enableFirstShowUsers) &&
              filteredUsers &&
              filteredUsers
                .filter((user) => user && user.uid) // Ensure valid users
                .map((user, index) => (
                  //check if index is less than 5
                  <ListItem key={index}>
                    <ListItemText
                      primary={user.displayName}
                      secondary={user.email}
                      sx={{ m: 0 }}
                    />
                    {isUserIncluded(user) ? (
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: theme.palette.grey[500],
                          '&:hover': {
                            backgroundColor: theme.palette.grey[700],
                          },
                        }}
                        onClick={async () => {
                          await handleRemoveMember(user);
                        }}
                      >
                        <Typography variant="body2" color="white">
                          Added
                        </Typography>
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: theme.palette.primary.main,
                          color: 'white',
                          mr: 0.5,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                          },
                        }}
                        onClick={() =>
                          setSingleMember
                            ? handleChangeMember(user)
                            : handleAddMember(user)
                        }
                      >
                        <Typography variant="body2">Add</Typography>
                      </Button>
                    )}
                  </ListItem>
                ))
            )}
          </List>
        </Box>
      </Box>
    </>
  );
}
