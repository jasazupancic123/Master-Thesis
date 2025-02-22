'use client';

import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useTheme } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { SPORTS } from '@/common/constant/sport.constant';
import { useScreenSize } from '@/context/screen-size-provider';
import { ProfilePageProps } from './type';
import { UserController } from '@/controller/user/user.controller';
import { SportLevel } from '@/controller/user/enum/sport-level.enum';
import { Gender } from '@/controller/user/enum/gender.enum';
import toast from 'react-hot-toast';

export default function ProfilePage(props: ProfilePageProps) {
  const { token, user } = props;

  const screenSize = useScreenSize();
  const theme = useTheme();
  const defaultMargin = 1;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>();
  const [dob, setDob] = useState<Dayjs | null>();
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sport, setSport] = useState('');
  const [sportLevel, setSportLevel] = useState<SportLevel>(SportLevel.BEGINNER);

  const handleSaveProfile = async () => {
    if (!firstName || !lastName || !email || !phoneNumber) {
      console.log('Please fill in all fields');
      return;
    }

    try {
      await UserController.updateProfile(token, {
        sport,
        level: sportLevel,
        gender,
        firstName,
        lastName,
        phone: phoneNumber,
        birthDate: dob?.toDate(),
        //groupsIds: user.groupsIds,
        groupsIds: [],
      });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error('Failed to update profile');
    }
  };

  useEffect(() => {
    if (!user) return;

    const names = user.displayName?.split(' ');
    setFirstName(names ? names[0] : '');
    setLastName(names && names.length > 1 ? names[1] : '');
    setGender(Gender.F); //not on user yet
    setDob(dayjs('2001-09-14'));
    setEmail(user.email);
    setPhoneNumber('+38670739540'); //not on user yet
    setSport(SPORTS[0]); //not on user yet
    setSportLevel(SportLevel.BEGINNER); //not on user yet
  }, []);

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
          m: defaultMargin,
          width: 64,
          height: 64,
        }}
      />
      <Button variant="contained" color="primary" sx={{ my: defaultMargin }}>
        Upload Photo
      </Button>

      {/* First & Last Name - Ensuring Equal Width */}
      <Box display="flex" width="100%" my={defaultMargin} gap={defaultMargin}>
        <TextField
          label={!firstName ? 'First Name' : undefined}
          variant="outlined"
          sx={{ flex: 1 }}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <TextField
          label={!lastName ? 'Last Name' : undefined}
          variant="outlined"
          sx={{ flex: 1 }}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </Box>

      <Box display="flex" width="100%" my={defaultMargin}>
        {/* Gender Dropdown */}
        <FormControl sx={{ flex: 1, mr: defaultMargin }}>
          <InputLabel>Gender</InputLabel>
          <Select
            value={gender}
            label="Gender"
            onChange={(e) => setGender(e.target.value as Gender)}
          >
            {Object.values(Gender).map((gender) => (
              <MenuItem key={gender} value={gender}>
                {gender}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Date of Birth (Ensuring Full Width) */}
        <LocalizationProvider dateAdapter={AdapterDayjs as any}>
          <DatePicker
            label="Date of Birth"
            value={dob || null}
            onChange={(newValue) => setDob(newValue)}
            format="DD/MM/YYYY"
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
            sx={{ flex: 1 }}
          />
        </LocalizationProvider>
      </Box>
      <TextField
        label={!email ? 'Email' : undefined}
        value={email}
        variant="outlined"
        fullWidth
        sx={{ my: defaultMargin }}
        onChange={(e) => setEmail(e.target.value)}
      />
      {/* Phone Number Input */}
      <TextField
        label={!phoneNumber ? 'Phone number' : undefined}
        value={phoneNumber}
        variant="outlined"
        type="tel" // Triggers numeric keyboard on mobile
        inputProps={{
          pattern: '[0-9]*', // Allows only numbers
        }}
        sx={{ width: '100%', my: defaultMargin }}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <Box display="flex" width="100%" gap={defaultMargin} my={defaultMargin}>
        <FormControl sx={{ flex: 1 }}>
          <InputLabel>Sport</InputLabel>
          <Select
            value={sport}
            label="Sport"
            onChange={(e) => setSport(e.target.value)}
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
            value={sportLevel}
            label="Sport Level"
            onChange={(e) => setSportLevel(e.target.value as SportLevel)}
          >
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
        sx={{ my: defaultMargin }}
        onClick={handleSaveProfile}
      >
        Save Profile
      </Button>
    </Box>
  );
}
