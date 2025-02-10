import { useEffect, useState } from 'react';
import {
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import Box from '@mui/material/Box';
import { theme } from '@/app/style';
import { User } from '@/controller/user/type/user.type';
import { SearchBar } from '../search-bar';
import { AddMembersModalProps } from './type';

export function AddMembersModal(props: AddMembersModalProps) {
  const { users, members, setMembers, addUserToEnd } = props;

  const [searchQueryAddPlayer, setSearchQueryAddPlayer] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[] | null>(null);

  const handleAddMember = (user: User) => {
    if (members.some((m) => m.uid === user.uid)) return;

    const updatedMembers = props.addUserToEnd
      ? [...members, user]
      : [user, ...members];

    setMembers(updatedMembers);
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
        <Typography variant="h6" mb={2}>
          Add Members
        </Typography>
      </Box>

      <Box display="flex" flexDirection="column" minWidth={300}>
        <Box display="flex" justifyContent="center" alignItems="center" p={1}>
          <SearchBar
            placeholder="Search Users"
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
                        {members.some((m) => m.uid === user.uid) ? (
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
