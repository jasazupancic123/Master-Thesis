'use client';

import { SPORTS } from '@/common/constant/sport.constant';
import { handleApiRequest } from '@/common/type/state.type';
import { useScreenSize } from '@/context/screen-size-provider';
import { Gender } from '@/controller/user/enum/gender.enum';
import { SportLevel } from '@/controller/user/enum/sport-level.enum';
import { UserEntity } from '@/controller/user/type/user.type';
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
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ProfilePageProps } from './type';

const DEFAULT_MARGIN = 1;

export default function ProfilePage(props: ProfilePageProps) {
  const { token, user } = props;

  const router = useRouter();
  const screenSize = useScreenSize();
  const theme = useTheme();
  const [profile, setProfile] = useState({
    sport: '',
    level: undefined as SportLevel | undefined,
    gender: undefined as Gender | undefined,
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: null as Dayjs | null,
  });

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const profile = await UserController.findProfile(token);
        if (profile) {
          const newProfile = {
            sport: profile.sport || '',
            level: (profile.level as SportLevel) || SportLevel.BEGINNER,
            gender: profile.gender || undefined,
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            phone: profile.phone || '',
            birthDate: profile.birthDate ? dayjs(profile.birthDate) : null,
          };
          setProfile(newProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user, token]);

  function handleChangeProfile(key: keyof UserEntity, value: any) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveProfile() {
    const { sport, level, gender, firstName, lastName, phone, birthDate } =
      profile;

    if (!firstName || !lastName || !phone)
      return toast.error('Please fill in all fields');

    handleApiRequest(
      router,
      () =>
        UserController.updateProfile(token, {
          sport,
          level,
          gender,
          firstName,
          lastName,
          phone,
          birthDate: birthDate?.toDate(),
        }),
      (_) => {
        toast.success('Profile updated successfully');
      },
      undefined,
      'Failed to update profile'
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      height="100vh"
      overflow="auto"
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
      <Button variant="contained" color="primary" sx={{ my: DEFAULT_MARGIN }}>
        Upload Photo
      </Button>

      {/* First & Last Name - Ensuring Equal Width */}
      <Box display="flex" width="100%" my={DEFAULT_MARGIN} gap={DEFAULT_MARGIN}>
        <TextField
          label={!profile.firstName ? 'First Name' : undefined}
          variant="outlined"
          sx={{ flex: 1 }}
          value={profile.firstName}
          onChange={(e) => handleChangeProfile('firstName', e.target.value)}
        />

        <TextField
          label={!profile.lastName ? 'Last Name' : undefined}
          variant="outlined"
          sx={{ flex: 1 }}
          value={profile.lastName}
          onChange={(e) => handleChangeProfile('lastName', e.target.value)}
        />
      </Box>

      <Box display="flex" width="100%" my={DEFAULT_MARGIN}>
        {/* Gender Dropdown */}
        <FormControl sx={{ flex: 1, mr: DEFAULT_MARGIN }}>
          <InputLabel>Gender</InputLabel>
          <Select
            value={profile.gender ?? ''} // Use nullish coalescing (??) to allow empty value
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
            value={profile.birthDate || null}
            onChange={(newValue) => handleChangeProfile('birthDate', newValue)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { fullWidth: true } }}
            sx={{ flex: 1 }}
          />
        </LocalizationProvider>
      </Box>

      {/* Phone Number Input */}
      <TextField
        label={!profile.phone ? 'Phone number' : undefined}
        value={profile.phone}
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
            value={profile.sport}
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
            value={profile.level ?? ''}
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
