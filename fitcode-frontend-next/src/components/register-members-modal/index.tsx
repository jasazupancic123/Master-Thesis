import { useState } from 'react';
import { UserController } from '@/controller/user/user.controller';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useGroup } from '@/context/group-provider';
import toast from 'react-hot-toast';

export default function RegisterMembersModal() {
  const { token } = useGroup();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegisterMember = async () => {
    if (!email || !displayName || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await UserController.addAthlete(token, { email, displayName, password });
      console.log('here123');
      toast.success('Member registered successfully');
      setEmail('');
      setDisplayName('');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error('Failed to register member');
    }
  };

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
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="dense"
      />
      <TextField
        fullWidth
        label="Display Name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        margin="dense"
      />
      <TextField
        fullWidth
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="dense"
      />
      <TextField
        fullWidth
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
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
