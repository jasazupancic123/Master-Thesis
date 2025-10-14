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

import { updateUserProfile } from '../../actions/actions-users';
import {
  handleChangeProfile,
  handleChangeUser,
} from './actions/actions-profile';
import useDashboardEditAthleteModalUseProfile from './hooks/use-profile';
import { SPORTS } from '@/common/constant/sport.constant';
import { FirebaseStorageUtil } from '@/common/firebase/firebase-storage.util';
import type { ModalProps } from '@/common/type/modal-props.type';
import { type SetState } from '@/common/type/state.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import { Gender } from '@/controller/profile/enum/gender.enum';
import { SportLevel } from '@/controller/profile/enum/sport-level.enum';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import FileUpload from '@/util/file-upload/file-upload';
import MyModal from '@/util/modal/modal';

const firebaseStorage = FirebaseStorageUtil.Instance;

interface DashboardEditAthleteModalProps {
  editUser: AuthUser | null;
  setEditUser: SetState<AuthUser | null>;
  setFilteredUsers: SetState<AuthUser[]>;
}

const DEFAULT_MARGIN = 1;

export default function DashboardEditAthleteModal(
  props: DashboardEditAthleteModalProps & ModalProps
) {
  const {
    open,
    setOpen,
    setFilteredUsers,
    editUser: userToEdit,
    setEditUser: setUserToEdit,
  } = props;

  const screenSize = useScreenSize();
  const router = useRouter();
  const { user } = useAuthenticatedAuth();

  const dashboardContext = useDashboard();

  const profileContext = useDashboardEditAthleteModalUseProfile(userToEdit);

  const {
    profileToEdit,
    setProfileToEdit,
    isEditedProfile,
    setIsEditedProfile,
    isEditedUser,
    setIsEditedUser,
  } = profileContext;

  return (
    <MyModal
      isOpen={open && userToEdit?.uid !== user.uid}
      setIsOpen={(open) => setOpen(open)}
      onCancel={() => {
        setOpen(false);
        setIsEditedProfile(false);
        setIsEditedUser(false);
        setUserToEdit(null);
        setProfileToEdit(undefined);
      }}
      cancelText="Close"
      onConfirm={() => {
        if ((isEditedProfile && profileToEdit) || (userToEdit && isEditedUser))
          updateUserProfile(
            {
              router,
              userToEdit,
              isEditedUser,
              profileToEdit,
              setOpenModal: setOpen,
              setIsEditedProfile,
              setUserToEdit,
            },
            {
              useDashboard: dashboardContext,
            }
          );
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
            handleChangeUser(
              {
                key: 'photoURL',
                value: url,
                userToEdit,
                setUserToEdit,
                setFilteredUsers,
              },
              {
                useProfile: profileContext,
              }
            );
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
            onChange={(e) =>
              handleChangeUser(
                {
                  key: 'displayName',
                  value: e.target.value,
                  userToEdit,
                  setUserToEdit,
                  setFilteredUsers,
                },
                {
                  useProfile: profileContext,
                }
              )
            }
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
                handleChangeProfile(
                  {
                    key: 'gender',
                    value: e.target.value as Gender,
                    userToEdit,
                  },
                  {
                    useProfile: profileContext,
                  }
                )
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
                handleChangeProfile(
                  {
                    key: 'birthDate',
                    value: newValue?.toDate(),
                    userToEdit,
                  },
                  {
                    useProfile: profileContext,
                  }
                )
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
              onChange={(e) =>
                handleChangeProfile(
                  {
                    key: 'sport',
                    value: e.target.value,
                    userToEdit,
                  },
                  {
                    useProfile: profileContext,
                  }
                )
              }
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
                handleChangeProfile(
                  {
                    key: 'level',
                    value: e.target.value as SportLevel,
                    userToEdit,
                  },
                  {
                    useProfile: profileContext,
                  }
                )
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
