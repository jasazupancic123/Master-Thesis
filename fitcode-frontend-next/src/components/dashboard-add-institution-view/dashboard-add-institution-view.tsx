import { useDashboard } from '@/store/dashboard-provider';
import { User } from '@/controller/user/type/user.type';
import { Box, Button, Grid2, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useTheme } from '@mui/material';
import MyModal from '@/components/modal/modal';
import { AddMembersModal } from '@/components/add-members-modal/add-members-modal';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import UsersSelectList from '../dashboard-users-select-list/dashboard-users-select-list';
import toast from 'react-hot-toast';
import FileUpload from '../file-upload/file-upload';
import { FirebaseStorageUtil } from '@/common/service/util/firebase-storage.util';
import { handleApiRequest } from '@/common/type/state.type';
import { useRouter } from 'next/navigation';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { InstitutionService } from '@/controller/institution/institution.service';
import { useScreenSize } from '@/store/screen-size-provider';

export default function AddInstitutionDashboard() {
  const { users } = useDashboard();
  const theme = useTheme();
  const router = useRouter();
  const screenSize = useScreenSize();

  const { token, setInstitutions } = useDashboard();

  const [allTrainers, setAllTrainers] = useState(
    (users || []).filter((user) =>
      user.customClaims?.role.includes(UserRole.TRAINER)
    )
  );
  const [allManagers, setAllManagers] = useState(
    (users || []).filter((user) =>
      user.customClaims?.role.includes(UserRole.MANAGER)
    )
  );
  const [allAthletes, setAllAthletes] = useState(
    (users || []).filter((user) =>
      user.customClaims?.role.includes(UserRole.ATHLETE)
    )
  );

  const [modal, setModal] = useState({
    add_owner: false,
    add_trainers: false,
    add_athletes: false,
  });
  const [name, setName] = useState('');
  const [owner, setOwner] = useState<User | null>(null);
  const [trainers, setTrainers] = useState<User[]>([]);
  const [athletes, setAthletes] = useState<User[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const handleAddInstitution = () => {
    if (name.trim().length < 3) {
      toast.error('Institution name must be at least 3 characters long');
      return;
    }

    if (!owner) {
      toast.error('Owner is required');
      return;
    }

    if (!imageUrl) {
      toast.error('Image is required');
      return;
    }

    const input = {
      name,
      imageUrl,
      ownerId: owner.uid,
      trainerIds: trainers.map((t) => t.uid),
      athleteIds: athletes.map((a) => a.uid),
    };

    handleApiRequest(
      router,
      () => InstitutionController.create(token, input),
      (institution) => {
        institution = InstitutionService.mapUsers(
          [institution],
          users || []
        )[0];
        setInstitutions((prev) => {
          const newInstitutions = [...prev, institution];
          return newInstitutions;
        });
        setName('');
        setImageUrl(undefined);
        setOwner(null);
        setTrainers([]);
        setAthletes([]);
        setModal({
          add_owner: false,
          add_trainers: false,
          add_athletes: false,
        });
        toast.success('Successfully created institution!');
      },
      undefined,
      'Failed to create institution'
    );
  };

  return (
    <>
      <Box
        width={screenSize.isMobile ? '80%' : '50%'}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        marginX="auto"
        gap={1}
      >
        <TextField
          value={name}
          label="Institution Name"
          variant="outlined"
          fullWidth
          margin="normal"
          onChange={(e) => setName(e.target.value)}
          sx={{
            width: '50%',
            marginX: 'auto',
          }}
        />

        <Box
          display="flex"
          justifyContent="center"
          flexDirection={'column'}
          alignItems="center"
          gap={0.5}
        >
          <Typography variant="h6" sx={{ textAlign: 'center' }}>
            Owner{owner ? `: ${owner.displayName}` : ''}
          </Typography>
          <Button
            variant="contained"
            onClick={() => setModal((prev) => ({ ...prev, add_owner: true }))}
          >
            {!owner ? 'Add owner' : 'Change owner'}
          </Button>
        </Box>

        {/*}
        <Grid2
          width="100%"
          container
          size={12}
          gap={1}
          display="flex"
          justifyContent="space-evenly"
          alignItems="flex-start"
        >
          <Grid2
            size={5.5}
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={0.5}
          >
            <UsersSelectList
              allUsers={allTrainers}
              selectedUsers={trainers}
              setSelectedUsers={setTrainers}
              title="Trainers"
              addUsersTitle="Add Trainers"
            />
          </Grid2>
          <Grid2
            size={5.5}
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={0.5}
          >
            <UsersSelectList
              allUsers={allAthletes}
              selectedUsers={athletes}
              setSelectedUsers={setAthletes}
              title="Athletes"
              addUsersTitle="Add Athletes"
            />
          </Grid2>
        </Grid2>
        */}

        <Box
          display="flex"
          justifyContent="center"
          width="50%"
          sx={{
            marginX: 'auto',
          }}
        >
          <FileUpload
            label={!imageUrl?.length ? 'Image' : ''}
            input="image"
            initialFileUrl={imageUrl}
            onFileUpload={async (file: File) => {
              const path = `media/exercise/${Date.now()}-${file.name}`;
              const url = await FirebaseStorageUtil.uploadFile(file, path);
              setImageUrl(url);
            }}
          />
        </Box>

        <Box
          display="flex"
          justifyContent="center"
          flexDirection={'column'}
          alignItems="center"
        >
          <Button variant="contained" onClick={handleAddInstitution}>
            Add Institution
          </Button>
        </Box>
      </Box>

      <MyModal
        isOpen={modal.add_owner}
        setIsOpen={(open) => setModal((prev) => ({ ...prev, add_owner: open }))}
        onCancel={() => setModal((prev) => ({ ...prev, add_owner: false }))}
        onConfirm={() => setModal((prev) => ({ ...prev, add_owner: false }))}
        cancelText="Close"
      >
        <AddMembersModal
          users={allManagers}
          members={[]}
          setMembers={() => {}}
          addUserToEnd={true}
          setSingleMember={setOwner}
          singleMember={owner}
        />
      </MyModal>
    </>
  );
}
