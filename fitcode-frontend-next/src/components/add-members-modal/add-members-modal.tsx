import { theme } from '@/app/style';
import { User } from '@/controller/user/type/user.type';
import {
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import { SearchBar } from '../search-bar/search-bar';
import { useDashboard } from '@/store/dashboard-provider';
import { Group } from '@/controller/group/type/group.type';
import { Institution } from '@/controller/institution/type/institution.type';
import { SetState } from '@/common/type/state.type';

export type AddMembersModalProps = {
  title?: string;
  placeholder?: string;
  users: User[];
  members: User[];
  setMembers: SetState<User[]> | ((members: User[]) => void);
  addUserToEnd: boolean;
  dissableMaxWidth?: boolean;
  dashboardView?: boolean;
  group?: Group;
  selectedInstitution?: Institution | null;
  setSelectedInstitution?: SetState<Institution | null>;
  singleMember?: User | null; // for single member selection
  setSingleMember?: SetState<User | null>; // for single member selection
  enableFirstShowUsers?: boolean; // to show first 5 users when search is empty
};

export function AddMembersModal(props: AddMembersModalProps) {
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
  } = props;
  const { setDetectedChanges } = useDashboard();

  const [searchQueryAddPlayer, setSearchQueryAddPlayer] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[] | null>(null);

  const handleAddMember = (user: User) => {
    if (members.some((m) => m.uid === user.uid)) return;

    const updatedMembers = props.addUserToEnd
      ? [...members, user]
      : [user, ...members];

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

  const handleRemoveMember = (user: User) => {
    if (setSingleMember) {
      setSingleMember(null);
      return;
    }

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

  const handleChangeMember = (user: User) => {
    if (!setSingleMember) return;
    setSingleMember(user);
  };

  const isUserIncluded = (user: User) => {
    if (setSingleMember) {
      return user.uid === singleMember?.uid;
    }
    return members.some((m) => m.uid === user.uid);
  };

  useEffect(() => {
    let filteredUsers = users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchQueryAddPlayer.toLowerCase()) ||
        user.displayName
          ?.toLowerCase()
          .includes(searchQueryAddPlayer.toLowerCase())
    );

    filteredUsers.length = 5; // limit to 5
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
          <List>
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
                .map(
                  (user, index) =>
                    //check if index is less than 5
                    index < 5 && (
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
                            onClick={() => {
                              handleRemoveMember(user);
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
                    )
                )
            )}
          </List>
        </Box>
      </Box>
    </>
  );
}
