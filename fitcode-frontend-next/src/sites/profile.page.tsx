'use client';

import { ArrowBack, CameraAlt, Check } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import {
  LINK_DASHBOARD,
  LINK_TRAININGS,
} from '@/common/constant/navigation.constant';
import { SPORTS } from '@/common/constant/sport.constant';
import { FirebaseStorageUtil } from '@/common/firebase/firebase-storage.util';
import { handleApiRequest } from '@/common/type/state.type';
import FaceCapture from '@/components/face-capture/face-capture';
import FileUpload from '@/components/file-upload/file-upload';
import { AuthController } from '@/controller/auth/auth.controller';
import type { AuthUser } from '@/controller/auth/type/user.type';
import { Gender } from '@/controller/profile/enum/gender.enum';
import { SportLevel } from '@/controller/profile/enum/sport-level.enum';
import { UserRole } from '@/controller/profile/enum/user-role.enum';
import { ProfileController } from '@/controller/profile/profile.controller';
import type { Profile } from '@/controller/profile/type/user.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useProfile } from '@/store/profile.provider';
import { useScreenSize } from '@/store/screen-size.provider';

const DEFAULT_MARGIN = 1;

export default function ProfilePage() {
  const { user, setUser, customClaims, token } = useAuthenticatedAuth();

  const theme = useTheme();
  const router = useRouter();
  const screenSize = useScreenSize();

  const { profile: profileGlobal, setProfile: setProfileGlobal } = useProfile();

  const [profile, setProfile] = useState<
    Omit<Profile, 'createdAt' | 'updatedAt'>
  >({
    uid: user.uid,
    email: user.email!,
    sport: profileGlobal?.sport,
    level: profileGlobal?.level,
    gender: profileGlobal?.gender,
    birthDate: profileGlobal?.birthDate,
  });

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

  const [updatedProfile, setUpdatedProfile] = useState(false);
  const [updatedUser, setUpdatedUser] = useState(false);

  function handleChangeProfile<K extends keyof Profile>(
    key: K,
    value: Profile[K]
  ) {
    const newProfile = { ...profile, [key]: value };
    setProfile(newProfile);
    setUpdatedProfile(true);
  }

  function handleChangeUser<K extends keyof AuthUser>(
    key: K,
    value: AuthUser[K]
  ) {
    const newUser = { ...user, [key]: value };
    setUser(newUser);
    setUpdatedUser(true);
  }

  async function handleSaveProfile() {
    if (updatedProfile) {
      if (!profile) return;
      const { sport, level, gender, birthDate } = profile;

      handleApiRequest(
        router,
        () =>
          ProfileController.getInstance(token).update({
            sport,
            level,
            gender,
            birthDate,
            userId: profile.uid,
          }),
        (_) => {
          setProfileGlobal((prev) => ({
            ...prev!,
            sport,
            level,
            gender,
            birthDate,
          }));

          toast.success('Profile updated successfully');
        },
        undefined,
        'Failed to update profile'
      );
    }

    if (updatedUser) {
      // logic here
      const { displayName, photoURL } = user;

      handleApiRequest(
        router,
        () =>
          AuthController.getInstance(token).updateUser(user.uid, {
            displayName,
            photoURL,
          }),
        (_) => {
          toast.success('User updated successfully');
        },
        undefined,
        'Failed to update user'
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
                customClaims.role.includes(UserRole.TRAINER) ||
                customClaims.role.includes(UserRole.ADMIN) ||
                customClaims.role.includes(UserRole.MANAGER)
              ) {
                router.push(LINK_DASHBOARD.href);
              } else router.push(LINK_TRAININGS.href);
            }}
          >
            <ArrowBack />
          </IconButton>
        </Box>

        <FileUpload
          input="image"
          label="Upload Profile Image"
          initialFileUrl={user.photoURL || undefined}
          sx={{ width: 200, margin: 'auto', height: 150 }}
          dissableBorder={user?.photoURL ? true : false}
          makeRound
          onFileUpload={async (file) => {
            const path = `user/${user.uid}/${file.name}`;
            const url = await FirebaseStorageUtil.Instance.uploadFile(
              file,
              path
            );

            handleChangeUser('photoURL', url);
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
            onChange={(e) => handleChangeUser('displayName', e.target.value)}
          />
        </Box>

        <Box display="flex" width="100%" my={DEFAULT_MARGIN}>
          {/* Gender Dropdown */}
          <FormControl sx={{ flex: 1, mr: DEFAULT_MARGIN }}>
            <InputLabel>Gender</InputLabel>
            <Select
              value={profile?.gender ?? ''} // Use nullish coalescing (??) to allow empty value
              label="Gender"
              onChange={(e) =>
                handleChangeProfile('gender', e.target.value as Gender)
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
              value={profile?.birthDate ? dayjs(profile?.birthDate) : null}
              onChange={(newValue) =>
                handleChangeProfile('birthDate', newValue?.toDate())
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
              value={profile?.sport}
              label="Sport"
              onChange={(e) => handleChangeProfile('sport', e.target.value)}
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
              value={profile?.level ?? ''}
              label="Sport Level"
              onChange={(e) =>
                handleChangeProfile('level', e.target.value as SportLevel)
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
        {[
          customClaims?.faceFrontUrl,
          customClaims?.faceLeftUrl,
          customClaims?.faceRightUrl,
        ].some((url) => !url) ? (
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
        ) : (
          <Typography
            textAlign="center"
            gap={0.5}
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: theme.palette.success.main,
            }}
          >
            Face recognition images already uploaded <Check />
          </Typography>
        )}
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
