import {
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';

import { theme } from '@/app/style';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { Group } from '@/core/group/type/group.type';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { useDashboard } from '@/store/dashboard.provider';
import MyModal from '@/ui/modal';
import { SearchBar } from '@/ui/search-bar/search-bar';

interface Props extends ModalProps {
  title?: string;
  placeholder?: string;
  addTrainers?: boolean;
  group: Group | null;
  users: AuthUser[];
  disableMaxWidth?: boolean;
  enableFirstShowUsers?: boolean; // to show first 5 users when search is empty
  enableScroll?: boolean; // to enable scroll in the modal
}

export function AddMembersModal({
  group,
  users,
  addTrainers,
  title,
  placeholder,
  disableMaxWidth,
  enableFirstShowUsers,
  enableScroll,
  open,
  setOpen,
}: Props) {
  const { addGroupMember, removeGroupMember, updateGroup } = useDashboard();

  const [searchQueryAddPlayer, setSearchQueryAddPlayer] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[] | null>(null);

  const isUserIncluded = (user: AuthUser) => {
    if (addTrainers) return group?.trainerIds.includes(user.uid);

    return group?.membersIds.includes(user.uid);
  };

  useEffect(() => {
    const newFilteredUsers = users.filter(
      (user) =>
        user.email
          ?.toLowerCase()
          .includes(searchQueryAddPlayer.toLowerCase()) ||
        user.displayName
          ?.toLowerCase()
          .includes(searchQueryAddPlayer.toLowerCase())
    );

    if (!enableScroll) newFilteredUsers.length = 5; // limit to 5

    setFilteredUsers(
      newFilteredUsers
        .filter(
          (user, index, self) =>
            index === self.findIndex((t) => t.uid === user.uid)
        )
        .sort((a, b) => {
          const included = isUserIncluded;

          if (included(b) && !included(a)) return 1;
          if (included(a) && !included(b)) return -1;

          if (a.displayName && b.displayName) {
            return a.displayName.localeCompare(b.displayName);
          }
          return 0;
        })
    );
  }, [users, searchQueryAddPlayer]);

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      onCancel={() => setOpen(false)}
      cancelText="Close"
    >
      <Box display="flex" justifyContent="center" alignItems="center" p={1}>
        <Typography variant="h6">{title || 'Add Members'}</Typography>
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        minWidth={disableMaxWidth ? undefined : 300}
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
                      sx={{
                        m: 0,
                        '& .MuiTypography-body2': {
                          color: theme.palette.text.primary,
                        },
                      }}
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
                          if (!group) return;

                          if (addTrainers) {
                            const updatedGroup: Group = {
                              ...group,
                              trainerIds: group.trainerIds.filter(
                                (id) => id !== user.uid
                              ),
                            };

                            await updateGroup(updatedGroup.id, updatedGroup);
                          } else await removeGroupMember(user.uid, group.id);
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
                          mr: 0.5,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                          },
                        }}
                        onClick={async () => {
                          if (!group) return;

                          if (addTrainers) {
                            const updatedGroup: Group = {
                              ...group,
                              trainerIds: [group.trainerIds, user.uid].flat(),
                            };

                            await updateGroup(updatedGroup.id, updatedGroup);
                          } else await addGroupMember(user, group.id);
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          Add
                        </Typography>
                      </Button>
                    )}
                  </ListItem>
                ))
            )}
          </List>
        </Box>
      </Box>
    </MyModal>
  );
}
