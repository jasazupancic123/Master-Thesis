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
import FileUpload from '../file-upload/file-upload';
import MyModal from '../modal/modal';
import { SPORTS } from '@/common/constant/sport.constant';
import { FirebaseStorageUtil } from '@/common/firebase/firebase-storage.util';
import type { SetState } from '@/common/type/state.type';
import { Gender } from '@/controller/user/enum/gender.enum';
import { SportLevel } from '@/controller/user/enum/sport-level.enum';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import type { User, UserEntity } from '@/controller/user/type/user.type';
import { UserController } from '@/controller/user/user.controller';
import { useAuthenticatedAuth, withAuth } from '@/store/auth-provider';
import { useDashboard } from '@/store/dashboard-provider';
import { useScreenSize } from '@/store/screen-size-provider';

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
  editUser: User | null;
  setEditUser: SetState<User | null>;
}

const DEFAULT_MARGIN = 1;

export default withAuth(DashboardEditAthleteModal, [UserRole.TRAINER]);

function DashboardEditAthleteModal(props: DashboardEditAthleteModalProps) {
  const { selectedInstitution, members, refetchMembers } = useDashboard();
  const auth = useAuthenticatedAuth();
  const controller = UserController.getInstance(auth.token);

  const screenSize = useScreenSize();
  const router = useRouter();

  const { isOpen, setModal, editUser, setEditUser } = props;
  const [editedUser, setEditedUser] = useState(false);
  const [editedProfile, setEditedProfile] = useState(false);
  const [profile, setProfile] = useState<UserEntity | undefined>(undefined);

  useEffect(() => {
    if (!editUser) return;
    const member = members.find((m) => m.id === editUser.uid);
    setProfile(member);
  }, [editUser]);

  function handleChangeProfile<K extends keyof UserEntity>(
    key: K,
    value: UserEntity[K]
  ) {
    const newProfile = { ...profile, [key]: value };
    setProfile(newProfile as UserEntity);
    setEditedProfile(true);
  }

  function handleChangeUser<K extends keyof User>(key: K, value: User[K]) {
    if (!editUser) return;

    const newUser = { ...editUser, [key]: value };
    setEditUser(newUser);
    setEditedUser(true);
  }

  return (
    <MyModal
      isOpen={isOpen}
      setIsOpen={(open) =>
        setModal((prev) => ({ ...prev, edit_athlete: open }))
      }
      onCancel={() => {
        setModal((prev) => ({ ...prev, edit_athlete: false }));
        setEditedProfile(false);
        setEditedUser(false);
        setEditUser(null);
      }}
      onConfirm={() => {
        if (editedProfile) {
          updateUserProfile(controller, {
            editUser,
            router,
            selectedInstitution,
            profile,
            setModal,
            setEditedProfile,
            setEditUser,
            refetchMembers,
          });
        }

        if (editUser && editedUser) {
          // here logic to update user, need BE route for it
        }
      }}
      cancelText="Close"
    >
      <Box display="flex" flexDirection="column" gap={2}>
        <FileUpload
          input="image"
          label="Image"
          initialFileUrl={profile?.profileImageUrl || undefined}
          dissableBorder={
            profile?.profileImageUrl !== undefined &&
            profile?.profileImageUrl !== null
          }
          makeRound
          sx={{
            maxWidth: screenSize.isMobile ? 200 : 400,
            maxHeight: screenSize.isMobile ? 150 : 300,
            margin: 'auto',
          }}
          onFileUpload={async (file) => {
            if (!editUser) return;

            const path = `user/${editUser.uid}/${file.name}`;
            const url = await firebaseStorage.uploadFile(file, path);
            setProfile((prev) =>
              !prev
                ? undefined
                : {
                    ...prev,
                    profileImageUrl: url,
                  }
            );

            if (profile) setEditedProfile(true);
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
            label={!editUser?.displayName ? 'Display Name' : undefined}
            variant="outlined"
            sx={{ flex: 1 }}
            value={editUser?.displayName || ''}
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

        {/* Phone Number Input */}
        <TextField
          label={!profile?.phone ? 'Phone Number' : undefined}
          value={profile?.phone || ''}
          type="tel" // Triggers numeric keyboard on mobile
          inputProps={{ pattern: '[0-9]*' }}
          sx={{ width: '100%', my: DEFAULT_MARGIN }}
          onChange={(e) => handleChangeProfile('phone', e.target.value)}
        />

        <Box
          display="flex"
          width="100%"
          gap={DEFAULT_MARGIN}
          my={DEFAULT_MARGIN}
        >
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Sport</InputLabel>
            <Select
              value={profile?.sport || ''}
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
      </Box>
    </MyModal>
  );
}
