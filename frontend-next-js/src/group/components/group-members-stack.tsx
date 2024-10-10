import { Group } from '@/group/entity/group.entity';
import { User } from '@/user/type/user.type';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { Tooltip } from '@mui/material';
import Avatar from '@mui/material/Avatar';

interface Props {
  group: Group;
  onClick: (member: User) => void;
}

export default function GroupMembersStack(props: Props) {
  const { group, onClick } = props;
  const { members } = group;

  return (
    <Stack direction="row" spacing={1} my={4} sx={{ cursor: 'pointer' }}>
      {members && members.map(member => (
        <Box key={member.uid} onClick={() => onClick(member)} sx={{ cursor: 'pointer' }}>
          <Tooltip title={member.email}>
            <Avatar>{member.email[0]}</Avatar>
          </Tooltip>
        </Box>
      ))}
    </Stack>
  );
}