import { handleApiRequest } from '@/common/type/state.type';
import { useGroup } from '@/context/group-provider';
import { UserController } from '@/controller/user/user.controller';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

const EMPTY_MEMBER = {
  email: '',
  displayName: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterMembersModal() {
  const router = useRouter();
  const { token, setUsers } = useGroup();
  const [member, setMember] = useState(EMPTY_MEMBER);

  async function handleRegisterMember() {
    const { email, displayName, password, confirmPassword } = member;

    if (!email || !displayName || !password || !confirmPassword)
      return toast.error('Please fill in all fields');

    if (password !== confirmPassword)
      return toast.error('Passwords do not match');

    handleApiRequest(
      router,
      () => UserController.addAthlete(token, { email, displayName, password }),
      (user) => {
        setUsers((prev) => [...prev, user]);
        setMember(EMPTY_MEMBER);
        toast.success('Member registered successfully');
      },
      undefined,
      'Failed to register member'
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={3}
      minWidth={300}
    >
      {/* Title */}
      <Typography variant="h6" mb={2} textAlign="center">
        Register Member
      </Typography>

      {/* Input Fields */}
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={member.email}
        onChange={(e) =>
          setMember((prev) => ({ ...prev, email: e.target.value }))
        }
        margin="dense"
      />

      <TextField
        fullWidth
        label="Display Name"
        value={member.displayName}
        onChange={(e) =>
          setMember((prev) => ({ ...prev, displayName: e.target.value }))
        }
        margin="dense"
      />

      <TextField
        fullWidth
        label="Password"
        type="password"
        value={member.password}
        onChange={(e) =>
          setMember((prev) => ({ ...prev, password: e.target.value }))
        }
        margin="dense"
      />

      <TextField
        fullWidth
        label="Confirm Password"
        type="password"
        value={member.confirmPassword}
        onChange={(e) =>
          setMember((prev) => ({ ...prev, confirmPassword: e.target.value }))
        }
        margin="dense"
      />

      {/* Register Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleRegisterMember}
        sx={{ mt: 2, textTransform: 'none', fontWeight: 'bold' }}
      >
        Register Member
      </Button>
    </Box>
  );
}
