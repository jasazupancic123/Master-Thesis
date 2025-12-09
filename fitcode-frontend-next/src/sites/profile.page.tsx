'use client';

import { ArrowBack, CameraAlt } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import FaceCapture from '@/components/face-capture/face-capture';
import { Gender } from '@/core/user/enum/gender.enum';
import { SportLevel } from '@/core/user/enum/sport-level.enum';
import { UserRole } from '@/core/user/enum/user-role.enum';
import type { User } from '@/core/user/type/user.type';
import { UserController } from '@/core/user/user.controller';
import { lib } from '@/lib';
import { InputType } from '@/lib/common/const/input-type.const';
import {
  LINK_ATHLETE_HOME,
  LINK_DASHBOARD,
} from '@/lib/common/const/nav.const';
import { SPORTS } from '@/lib/common/const/sport.const';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import FileUpload from '@/ui/file-upload';

const DEFAULT_MARGIN = 1;

export default function ProfilePage() {
  const { user, setUser, role } = useAuthenticatedAuth();
  const router = useRouter();
  const screenSize = useScreenSize();

  const [isCapturingFace, setIsCapturingFace] = useState<boolean>(false);
  const [captures, setCaptures] = useState<{
    front?: Blob;
    right?: Blob;
    left?: Blob;
  }>({});
  const [previews, setPreviews] = useState<{
    front?: string;
    right?: string;
    left?: string;
  }>({});

  const [updatedUser, setUpdatedUser] = useState(false);

  // multiple key/value update
  function handleChangeUser<K extends keyof User>(updates: Partial<User>) {
    const newUser = { ...user, ...updates };
    setUser(newUser);
    setUpdatedUser(true);
  }

  async function handleSaveProfile() {
    if (updatedUser) {
      handleApiRequest(
        router,
        () => UserController.getInstance().update(user.uid, user),
        (_) => {
          toast.success('Profile updated successfully');
        },
        undefined,
        'Failed to update profile'
      );
    }
  }

  return isCapturingFace ? (
    <FaceCapture
      setIsCapturingFace={setIsCapturingFace}
      previews={previews}
      setPreviews={setPreviews}
      captures={captures}
      setCaptures={setCaptures}
    />
  ) : (
    <Box
      width="100%"
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="space-between"
      pb={2}
    >
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{
          overflowY: 'auto',
        }}
        pt={screenSize.isMobile || screenSize.isLandscapeMobile ? 0 : 8}
        pb={screenSize.isLandscapeMobile ? 15 : undefined}
      >
        <Box
          width="100%"
          display="flex"
          minHeight={50}
          justifyContent="flex-start"
          alignItems="center"
        >
          <IconButton
            sx={{ p: 0, m: 0 }}
            onClick={() => {
              if (
                role === UserRole.TRAINER ||
                role === UserRole.ADMIN ||
                role === UserRole.MANAGER
              ) {
                router.push(LINK_DASHBOARD.href);
              } else router.push(LINK_ATHLETE_HOME.href);
            }}
          >
            <ArrowBack />
          </IconButton>
        </Box>

        <FileUpload
          input={InputType.IMAGE}
          label="Upload Profile Image"
          initialFileUrl={user.photoURL || undefined}
          sx={{ width: 200, margin: 'auto', height: 150 }}
          disableBorder={user?.photoURL ? true : false}
          makeRound
          onFileUpload={async (file) => {
            const path = `user/${user.uid}/${file.name}`;
            const { url, base64 } =
              await lib.firebase.storage.uploadFileWithBase64(file, path, {
                maxDimensionCrop: 300,
              });

            handleChangeUser({ photoURL: url, photoURLBase64: base64 });
          }}
        />

        {/* First & Last Name - Ensuring Equal Width */}
        <Box
          display="flex"
          width="100%"
          my={DEFAULT_MARGIN}
          gap={DEFAULT_MARGIN}
        >
          <TextField
            label={!user.displayName ? 'Display Name' : undefined}
            variant="outlined"
            sx={{ flex: 1 }}
            value={user?.displayName}
            onChange={(e) => handleChangeUser({ displayName: e.target.value })}
          />
        </Box>

        <Box display="flex" width="100%" my={DEFAULT_MARGIN}>
          {/* Gender Dropdown */}
          <FormControl sx={{ flex: 1, mr: DEFAULT_MARGIN }}>
            <InputLabel>Gender</InputLabel>
            <Select
              value={user?.gender ?? ''} // Use nullish coalescing (??) to allow empty value
              label="Gender"
              onChange={(e) =>
                handleChangeUser({ gender: e.target.value as Gender })
              }
            >
              <MenuItem value="" disabled>
                Select Gender
              </MenuItem>
              {Object.values(Gender).map((gender) => (
                <MenuItem key={gender} value={gender}>
                  {gender.charAt(0).toUpperCase() +
                    gender.slice(1).toLowerCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date of Birth (Ensuring Full Width) */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date of Birth"
              value={user?.birthDate ? dayjs(user?.birthDate) : null}
              onChange={(newValue) =>
                handleChangeUser({ birthDate: newValue?.toDate() })
              }
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true } }}
              sx={{ flex: 1 }}
            />
          </LocalizationProvider>
        </Box>

        <Box
          display="flex"
          width="100%"
          gap={DEFAULT_MARGIN}
          my={DEFAULT_MARGIN}
        >
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Sport</InputLabel>
            <Select
              value={user?.sport}
              label="Sport"
              onChange={(e) => handleChangeUser({ sport: e.target.value })}
            >
              {SPORTS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Sport Level</InputLabel>
            <Select
              value={user?.level ?? ''}
              label="Sport Level"
              onChange={(e) =>
                handleChangeUser({ level: e.target.value as SportLevel })
              }
            >
              <MenuItem value="" disabled>
                Select Sport Level
              </MenuItem>
              {Object.values(SportLevel).map((sl) => (
                <MenuItem key={sl} value={sl}>
                  {sl.charAt(0).toUpperCase() + sl.slice(1).toLowerCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box
          width="100%"
          display="flex"
          justifyContent="center"
          gap={1}
          alignItems="center"
        >
          <Button
            variant="contained"
            color="primary"
            sx={{ my: DEFAULT_MARGIN }}
            onClick={() => setIsCapturingFace(true)}
          >
            <CameraAlt />
          </Button>
        </Box>
      </Box>
      <Button
        variant="contained"
        color="primary"
        sx={{ my: DEFAULT_MARGIN }}
        onClick={handleSaveProfile}
      >
        Save Profile
      </Button>
    </Box>
  );
}
