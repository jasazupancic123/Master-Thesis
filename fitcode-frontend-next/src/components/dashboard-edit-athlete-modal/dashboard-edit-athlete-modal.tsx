import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { updateUserProfile } from '../dashboard-groups-members/state';
import MyModal from '../../util/modal/modal';
import { SPORTS } from '@/common/constant/sport.constant';
import { FirebaseStorageUtil } from '@/common/firebase/firebase-storage.util';
import { type SetState } from '@/common/type/state.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import { Gender } from '@/controller/profile/enum/gender.enum';
import { SportLevel } from '@/controller/profile/enum/sport-level.enum';
import type { Profile } from '@/controller/profile/type/user.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import FileUpload from '@/util/file-upload/file-upload';

const firebaseStorage = FirebaseStorageUtil.Instance;

interface DashboardEditAthleteModalProps {
  isOpen: boolean;
  setModal: SetState<{
    add_member: boolean;
    add_trainer: boolean;
    add_group: boolean;
    add_member_via_csv: boolean;
    edit_athlete: boolean;
  }>;
  editUser: AuthUser | null;
  setEditUser: SetState<AuthUser | null>;
  setFilteredUsers: SetState<AuthUser[]>;
}

const DEFAULT_MARGIN = 1;

export default function DashboardEditAthleteModal(
  props: DashboardEditAthleteModalProps
) {
  const {
    isOpen,
    setModal,
    setFilteredUsers,
    editUser: userToEdit,
    setEditUser: setUserToEdit,
  } = props;
  const [profileToEdit, setProfileToEdit] = useState<Profile | undefined>();

  const screenSize = useScreenSize();
  const router = useRouter();
  const { user } = useAuthenticatedAuth();
  const { selectedInstitution, members, refetchMembers, refetchUsers } =
    useDashboard();

  const [isEditedUser, setIsEditedUser] = useState(false);
  const [isEditedProfile, setIsEditedProfile] = useState(false);

  useEffect(() => {
    if (!userToEdit) return;
    const profile = members.find((m) => m.uid === userToEdit.uid);
    setProfileToEdit(profile);
  }, [userToEdit]);

  function handleChangeProfile<K extends keyof Profile>(
    key: K,
    value: Profile[K]
  ) {
    if (!userToEdit) return;
    const newProfile = { ...profileToEdit, [key]: value };
    setProfileToEdit(newProfile as Profile);
    setIsEditedProfile(true);
  }

  function handleChangeUser<K extends keyof AuthUser>(
    key: K,
    value: AuthUser[K]
  ) {
    if (!userToEdit) return;
    const newUser = { ...userToEdit, [key]: value };
    setUserToEdit(newUser);
    setIsEditedUser(true);
    setFilteredUsers((prev) =>
      prev.map((user) => (user.uid === newUser.uid ? newUser : user))
    );
  }

  return (
    <MyModal
      isOpen={isOpen && userToEdit?.uid !== user.uid}
      setIsOpen={(open) =>
        setModal((prev) => ({ ...prev, edit_athlete: open }))
      }
      onCancel={() => {
        setModal((prev) => ({ ...prev, edit_athlete: false }));
        setIsEditedProfile(false);
        setIsEditedUser(false);
        setUserToEdit(null);
        setProfileToEdit(undefined);
      }}
      cancelText="Close"
      onConfirm={() => {
        if ((isEditedProfile && profileToEdit) || (userToEdit && isEditedUser))
          updateUserProfile({
            router,
            userToEdit,
            isEditedUser,
            selectedInstitution,
            profileToEdit,
            setModal,
            setIsEditedProfile,
            setIsEditedUser,
            setUserToEdit,
            refetchMembers,
            refetchUsers,
          });
      }}
    >
      <Box display="flex" flexDirection="column" gap={2}>
        <FileUpload
          input="image"
          label="Image"
          initialFileUrl={userToEdit?.photoURL || undefined}
          disableBorder={
            userToEdit?.photoURL !== undefined && userToEdit?.photoURL !== null
          }
          makeRound
          sx={{
            maxWidth: screenSize.isMobile ? 200 : 400,
            maxHeight: screenSize.isMobile ? 150 : 300,
            margin: 'auto',
          }}
          onFileUpload={async (file) => {
            if (!userToEdit) return;
            const path = `user/${userToEdit.uid}/${file.name}`;
            const url = await firebaseStorage.uploadFile(file, path);
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
            label={!userToEdit?.displayName ? 'Display Name' : undefined}
            variant="outlined"
            sx={{ flex: 1 }}
            value={userToEdit?.displayName || ''}
            onChange={(e) => handleChangeUser('displayName', e.target.value)}
          />
        </Box>

        <Box display="flex" width="100%" my={DEFAULT_MARGIN}>
          {/* Gender Dropdown */}
          <FormControl sx={{ flex: 1, mr: DEFAULT_MARGIN }}>
            <InputLabel>Gender</InputLabel>
            <Select
              value={profileToEdit?.gender ?? ''} // Use nullish coalescing (??) to allow empty value
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
              value={
                profileToEdit?.birthDate
                  ? dayjs(profileToEdit?.birthDate)
                  : null
              }
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
              value={profileToEdit?.sport || ''}
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
              value={profileToEdit?.level ?? ''}
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
      </Box>
    </MyModal>
  );
}
