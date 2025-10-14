import { Close as CloseIcon } from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import toast from 'react-hot-toast';

import GroupsDataGrid from './groups-data-grid/groups-data-grid';
import UsersDataGrid from '../../../../../users-data-grid/users-data-grid';
import { FirebaseStorageUtil } from '@/common/firebase/firebase-storage.util';
import type { Institution } from '@/controller/institution/type/institution.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import EditableTextField from '@/util/editable-text-field/editable-text-field';
import ImageUpload from '@/util/image-upload/image-upload';

interface InstitutionModalProps {
  open: boolean;
  institution: Institution;
  onClose: () => void;
}

export default function EditInstitutionModal({
  open,
  institution,
  onClose,
}: InstitutionModalProps) {
  const theme = useTheme();

  const [localData, setLocalData] = useState(institution);
  const [tab, setTab] = useState(0);

  const { user } = useAuthenticatedAuth();
  const { updateUser, updateGroup, updateInstitution, deleteGroup, addGroup } =
    useDashboard();

  const users = [
    institution.owner,
    ...institution.trainers,
    ...institution.athletes,
  ];

  const handleChange = (field: keyof Institution, value: unknown) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          backgroundColor: theme.palette.background.paper,
          boxShadow: '0 0 30px rgba(0,0,0,0.6)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography fontWeight={600} fontSize={18}>
          Institution Details
        </Typography>

        <IconButton onClick={onClose} size="small" color="inherit">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={3} direction="row">
          {/* Image */}
          <ImageUpload
            value={localData.imageUrl}
            onChange={async (file) => {
              try {
                const path = `user/${user.uid}/${file.name}`;
                const url = await FirebaseStorageUtil.Instance.uploadFile(
                  file,
                  path
                );

                handleChange('imageUrl', url);
                if (url !== institution.imageUrl)
                  updateInstitution(institution.id, { imageUrl: url });
              } catch (e) {
                console.error('Failed to upload image', e);
                toast.error((e as Error).message);
              }
            }}
          />

          <EditableTextField
            value={localData.name}
            onChange={(value) => {
              try {
                if (!value || value.length < 3)
                  throw new Error('Name must be at least 3 characters long');

                handleChange('name', value);
                if (value !== institution.name)
                  updateInstitution(institution.id, { name: value });
              } catch (e) {
                console.error('Failed to update institution name', e);
                toast.error((e as Error).message);
                setLocalData((prev) => ({ ...prev, name: institution.name }));
              }
            }}
          />
        </Stack>

        <Box my={2}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tab}
              onChange={(_, newValue) => setTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  color: 'white', // inactive tabs
                  textTransform: 'none',
                  fontWeight: 500,
                },
                '& .Mui-selected': {
                  color: 'primary.main', // active tab
                  fontWeight: 600,
                },
              }}
            >
              <Tab label="Users" {...a11yProps(0)} />
              <Tab label="Groups" {...a11yProps(1)} />
            </Tabs>
          </Box>

          <CustomTabPanel value={tab} index={0}>
            <UsersDataGrid users={users} onRowUpdate={updateUser} />
          </CustomTabPanel>

          <CustomTabPanel value={tab} index={1}>
            <GroupsDataGrid
              institution={institution}
              onRowUpdate={updateGroup}
              onRowDelete={deleteGroup}
              onRowAdd={addGroup}
            />
          </CustomTabPanel>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}
