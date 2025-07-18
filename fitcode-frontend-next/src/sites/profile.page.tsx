'use client';

import { SPORTS } from '@/common/constant/sport.constant';
import { FirebaseStorageUtil } from '@/common/service/util/firebase-storage.util';
import { handleApiRequest } from '@/common/type/state.type';
import FileUpload from '@/components/file-upload/file-upload';
import { useScreenSize } from '@/store/screen-size-provider';
import { Gender } from '@/controller/user/enum/gender.enum';
import { SportLevel } from '@/controller/user/enum/sport-level.enum';
import { User, UserEntity } from '@/controller/user/type/user.type';
import { UserController } from '@/controller/user/user.controller';
import {
  Avatar,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  useTheme,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/store/auth-provider';
import { useProfile } from '@/store/profile-provider';

const DEFAULT_MARGIN = 1;

export default function ProfilePage() {
  const {
    user,
    profile: profileGlobal,
    setProfile: setProfileGlobal,
  } = useAuth();

  const router = useRouter();
  const screenSize = useScreenSize();
  const theme = useTheme();

  const [profile, setProfile] = useState<UserEntity>({
    ...profileGlobal,
  } as UserEntity);

  function handleChangeProfile<K extends keyof UserEntity>(
    key: K,
    value: UserEntity[K]
  ) {
    const newProfile = { ...profile, [key]: value };
    setProfile(newProfile as UserEntity);
  }

  async function handleSaveProfile() {
    if (!profile) return;
    const {
      sport,
      level,
      gender,
      profileImageUrl,
      firstName,
      lastName,
      phone,
      birthDate,
    } = profile;

    handleApiRequest(
      router,
      () =>
        UserController.updateProfile({
          sport,
          level,
          gender,
          profileImageUrl,
          firstName,
          lastName,
          phone,
          birthDate,
        }),
      (_) => {
        setProfileGlobal(profile);
        toast.success('Profile updated successfully');
      },
      undefined,
      'Failed to update profile'
    );
  }

  if (!user) return null;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      height="100vh"
      sx={{
        overflowY: 'auto',
      }}
      pt={screenSize.isMobile || screenSize.isLandscapeMobile ? 0 : 8}
      pb={screenSize.isLandscapeMobile ? 15 : undefined}
    >
      <Avatar
        sx={{
          color: 'white',
          backgroundColor: theme.palette.primary.main,
          m: DEFAULT_MARGIN,
          width: 64,
          height: 64,
        }}
      />

      {/* <Button variant="contained" color="primary" sx={{ my: DEFAULT_MARGIN }}>
        Upload Photo
      </Button> */}

      <FileUpload
        input="image"
        label="Upload Profile Image"
        initialFileUrl={profile?.profileImageUrl || undefined}
        sx={{ maxWidth: 200, margin: 'auto', maxHeight: 150 }}
        onFileUpload={async (file) => {
          const path = `user/${user.uid}/${file.name}`;
          const url = await FirebaseStorageUtil.uploadFile(file, path);
          const newProfile = { ...profile, profileImageUrl: url };
          setProfile(newProfile as UserEntity);
        }}
      />

      {/* First & Last Name - Ensuring Equal Width */}
      <Box display="flex" width="100%" my={DEFAULT_MARGIN} gap={DEFAULT_MARGIN}>
        <TextField
          label={!profile.firstName ? 'First Name' : undefined}
          variant="outlined"
          sx={{ flex: 1 }}
          value={profile?.firstName}
          onChange={(e) => handleChangeProfile('firstName', e.target.value)}
        />

        <TextField
          label={!profile.lastName ? 'Last Name' : undefined}
          variant="outlined"
          sx={{ flex: 1 }}
          value={profile?.lastName}
          onChange={(e) => handleChangeProfile('lastName', e.target.value)}
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
                {gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Date of Birth (Ensuring Full Width) */}
        <LocalizationProvider dateAdapter={AdapterDayjs as any}>
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

      {/* Phone Number Input */}
      <TextField
        label={!profile?.phone ? 'Phone Number' : undefined}
        value={profile?.phone}
        variant="outlined"
        type="tel" // Triggers numeric keyboard on mobile
        inputProps={{ pattern: '[0-9]*' }}
        sx={{ width: '100%', my: DEFAULT_MARGIN }}
        onChange={(e) => handleChangeProfile('phone', e.target.value)}
      />

      <Box display="flex" width="100%" gap={DEFAULT_MARGIN} my={DEFAULT_MARGIN}>
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
