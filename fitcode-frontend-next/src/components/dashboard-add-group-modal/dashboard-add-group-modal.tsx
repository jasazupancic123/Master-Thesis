import { Box, TextField, Typography } from '@mui/material';

interface AddGroupModalProps {
  groupName: string;
  setGroupName: (groupName: string) => void;
}

export default function AddGroupModal(props: AddGroupModalProps) {
  const { groupName, setGroupName } = props;
  return (
    <>
      <Box display="flex" justifyContent="center" alignItems="center" p={1}>
        <Typography variant="h6">
          Add Group
        </Typography>
      </Box>
      <TextField
        id="outlined-basic"
        label="Group name"
        variant="outlined"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
    </>
  );
}
