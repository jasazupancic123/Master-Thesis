import { useEffect, useState } from 'react';
import {
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import { theme } from '@/app/style';
import { AddMembersModalProps } from '@/common/type/members.type';
import { User } from '@/controller/user/type/user.type';
import { SearchBar } from './search-bar';

export function AddMembersModal(props: AddMembersModalProps) {
  const [searchQueryAddPlayer, setSearchQueryAddPlayer] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[] | null>(null);
  const groupMembers = props.groupMembers;

  const handleAddPlayerSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = event.target.value;
    setSearchQueryAddPlayer(query);
  };

  const handleAddMember = (user: User) => {
    if (groupMembers.some((m) => m.uid === user.uid)) return;

    const updatedMembers = props.addUserToEnd
      ? [...groupMembers, user]
      : [user, ...groupMembers];
    props.setGlobalMembers(updatedMembers);
    setFilteredUsers((prev) => prev);
  };

  useEffect(() => {
    if (!props.users.data) return;
    let filteredUsers = props.users.data.filter(
      (user) =>
        user.email.toLowerCase().includes(searchQueryAddPlayer.toLowerCase()) ||
        user.displayName
          ?.toLowerCase()
          .includes(searchQueryAddPlayer.toLowerCase())
    );
    filteredUsers.length = 5;
    filteredUsers = filteredUsers.filter(
      (user, index, self) => index === self.findIndex((t) => t.uid === user.uid)
    );
    setFilteredUsers(filteredUsers);
  }, [searchQueryAddPlayer]);

  return (
    <>
      <Box display="flex" justifyContent="center" alignItems="center" p={1}>
        <Typography variant="h6" mb={2}>
          Add Members
        </Typography>
      </Box>

      <Box display="flex" flexDirection="column" minWidth={300}>
        <Box display="flex" justifyContent="center" alignItems="center" p={1}>
          <SearchBar
            placeholder="Search Users"
            value={searchQueryAddPlayer}
            handleSearchChange={handleAddPlayerSearchChange}
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
              searchQueryAddPlayer.length > 0 &&
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
                        {groupMembers.some((m) => m.uid === user.uid) ? (
                          <Button
                            variant="contained"
                            sx={{
                              backgroundColor: theme.palette.grey[500],
                              '&:hover': {
                                backgroundColor: theme.palette.grey[700],
                              },
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
                            onClick={() => handleAddMember(user)}
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
