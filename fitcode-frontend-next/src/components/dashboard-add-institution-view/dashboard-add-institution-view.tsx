import { Box, Button, FormControl, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import FileUpload from '../file-upload/file-upload';
import { CommonService } from '@/common/service/common.service';
import { FirebaseStorageUtil } from '@/common/service/util/firebase-storage.util';
import { handleApiRequest } from '@/common/type/state.type';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { InstitutionService } from '@/controller/institution/institution.service';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { useDashboard } from '@/store/dashboard-provider';
import { useMain } from '@/store/main-provider';
import { useScreenSize } from '@/store/screen-size-provider';

const commonService = CommonService.instance;
const firebaseService = commonService.firebase;

export default function AddInstitutionDashboard() {
  const { users } = useMain();
  const router = useRouter();
  const screenSize = useScreenSize();

  const { setInstitutions, refetchUsers } = useDashboard();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!name || !imageUrl || !email) return;

    const owner = users.find((user) => user.email === email.toLowerCase());

    if (!owner) {
      toast.error('Institution not registered correctly');
      return;
    }

    handleApiRequest(
      router,
      () =>
        InstitutionController.create({
          name,
          imageUrl,
          ownerId: owner.uid,
        }),
      (institution) => {
        institution = InstitutionService.mapUsers(
          [institution],
          users || []
        )[0];
        setInstitutions((prev) => {
          const newInstitutions = [...prev, institution];
          return newInstitutions;
        });
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setImageUrl('');
        toast.success('Successfully created institution!');
      },
      undefined,
      'Failed to create institution'
    );
  }, [users]);

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

    const userInput = {
      displayName: name,
      email,
      password,
      role: UserRole.MANAGER,
    };

    toast.error('Creating institution...', {
      icon: '⚠️',
      duration: 3000,
    });

    handleApiRequest(
      router,
      () => firebaseService.functions.createUserWithRole(userInput),
      () => {
        refetchUsers();
      },
      undefined,
      'Failed to register user'
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
              const url = await FirebaseStorageUtil.uploadFile(file, path);
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
