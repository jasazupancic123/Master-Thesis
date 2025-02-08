'use client';

import { useState } from 'react';
import withAuth from '@/common/components/with-auth';
import { GENDERS } from '@/common/constant/gender.constant';
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
import { Dayjs } from 'dayjs';
import { SPORT_LEVELS } from '@/common/constant/sport-level.constant';
import { SPORTS } from '@/common/constant/sport.constant';
import { useScreenSize } from '@/context/screen-size-provider';

function Page() {
  const screenSize = useScreenSize();
  const theme = useTheme();
  const defaultMargin = 1;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState<Dayjs | null>();
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sport, setSport] = useState('');
  const [sportLevel, setSportLevel] = useState('');

  const handleSaveProfile = async () => {
    //implement functionality
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      height="100vh"
      overflow="auto"
      pt={screenSize.isMobile || screenSize.isLandscapeMobile ? 2 : 8}
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
          label="First Name"
          variant="outlined"
          sx={{ flex: 1 }}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <TextField
          label="Last Name"
          variant="outlined"
          sx={{ flex: 1 }}
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
            onChange={(e) => setGender(e.target.value)}
          >
            {GENDERS.map((gender) => (
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
        label="Email"
        variant="outlined"
        fullWidth
        sx={{ my: defaultMargin }}
        onChange={(e) => setEmail(e.target.value)}
      />
      {/* Phone Number Input */}
      <TextField
        label="Phone number"
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
            onChange={(e) => setSportLevel(e.target.value)}
          >
            {SPORT_LEVELS.map((sl) => (
              <MenuItem key={sl} value={sl}>
                {sl}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Button variant="contained" color="primary" sx={{ my: defaultMargin }}>
        Save Profile
      </Button>
    </Box>
  );
}

export default withAuth(Page);
