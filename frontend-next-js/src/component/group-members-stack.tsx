import { Group } from '@/type/group.type';
import { User } from '@/type/user.type';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { Tooltip } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';

interface Props {
  group: Group;
  onClick: (member: User) => void;
}

export default function GroupMembersStack(props: Props) {
  const { group, onClick } = props;
  const { members, user } = group;

  return (
    <Stack spacing={2} direction="row">
      {members && members.map(member => (
        <Box key={member.uid} onClick={() => onClick(member)} sx={{ cursor: 'pointer' }}>
          <Tooltip title={member.email}>
            <Avatar>{member.email[0]}</Avatar>
          </Tooltip>
        </Box>
      ))}
    </Stack>
  )
}