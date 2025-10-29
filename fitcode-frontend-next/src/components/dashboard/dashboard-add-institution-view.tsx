'use client';

import { Box, Button, FormControl, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { AuthController } from '@/core/auth/auth.controller';
import type { CreateUser } from '@/core/auth/type/user.type';
import { core } from '@/core/core.service';
import { InstitutionController } from '@/core/institution/institution.controller';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import { lib } from '@/lib';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import FileUpload from '@/ui/file-upload';

export default function AddInstitutionDashboard() {
  const { users } = useMain();
  const router = useRouter();
  const screenSize = useScreenSize();
  const { setInstitutions, setUsers } = useDashboard();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const handleAddInstitution = () => {
    if (name.trim().length < 3) {
      toast.error('Institution name must be at least 3 characters long');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!imageUrl) {
      toast.error('Image is required');
      return;
    }

    const userInput: CreateUser = {
      displayName: name,
      email,
      password,
      role: UserRole.MANAGER,
    };

    handleApiRequest(
      router,
      async () => {
        const user = await AuthController.getInstance().registerUser(userInput);
        const institution = await InstitutionController.getInstance().create({
          name,
          imageUrl,
          ownerId: user.uid,
        });

        return { institution, user };
      },
      ({ user, institution }) => {
        institution = core.institution.mapUsers([institution], users || [])[0];
        setUsers((prev) => [...prev, user]);
        setInstitutions((prev) => [...prev, institution]);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setImageUrl('');
        toast.success('Successfully created institution!');
      },
      undefined,
      'Failed to create institution'
    );
  };

  return (
    <>
      <Box
        width={screenSize.isMobile ? '80%' : '50%'}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        marginX="auto"
        gap={1}
        mt={1}
      >
        <FormControl fullWidth sx={{ width: '50%', marginX: 'auto' }}>
          <TextField
            value={name}
            label="Institution Name"
            variant="outlined"
            fullWidth
            onChange={(e) => setName(e.target.value)}
          />
        </FormControl>

        <FormControl fullWidth sx={{ width: '50%', marginX: 'auto' }}>
          <TextField
            value={email}
            label="Email"
            variant="outlined"
            type="email"
            fullWidth
            inputProps={{ style: { textTransform: 'lowercase' } }}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>

        <FormControl fullWidth sx={{ width: '50%', marginX: 'auto' }}>
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>

        <FormControl fullWidth sx={{ width: '50%', marginX: 'auto' }}>
          <TextField
            label="Confirm Password"
            type="password"
            variant="outlined"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </FormControl>

        <Box
          display="flex"
          justifyContent="center"
          width="50%"
          sx={{
            marginX: 'auto',
            mt: 2,
          }}
        >
          <FileUpload
            label={!imageUrl?.length ? 'Image' : ''}
            input="image"
            initialFileUrl={imageUrl}
            onFileUpload={async (file: File) => {
              const path = `media/exercise/${Date.now()}-${file.name}`;
              const url = await lib.firebase.storage.uploadFile(file, path);
              setImageUrl(url);
            }}
          />
        </Box>

        <Box
          display="flex"
          justifyContent="center"
          flexDirection={'column'}
          alignItems="center"
        >
          <Button
            variant="contained"
            onClick={handleAddInstitution}
            sx={{
              mt: 2,
            }}
          >
            Add Institution
          </Button>
        </Box>
      </Box>
    </>
  );
}
