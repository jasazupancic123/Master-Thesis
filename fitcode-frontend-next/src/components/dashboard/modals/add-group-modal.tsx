import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { INDEX_DB_LAST_SELECTED_DASHBOARD_GROUP_ID } from '@/components/report-athlete-exercise/const/index-db-id.const';
import { core } from '@/core/core.service';
import { InstitutionController } from '@/core/institution/institution.controller';
import type { CreateGroup } from '@/core/institution/type/group.type';
import type { User } from '@/core/user/type/user.type';
import { lib } from '@/lib';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import MyModal from '@/ui/modal';

export default function AddGroupModal(props: ModalProps) {
  const router = useRouter();

  const { users, institution, setInstitution } = useMain();
  const { setDetectedChanges } = useDashboard();

  const { open, setOpen } = props;

  const [groupName, setGroupName] = useState('');
  const [shortName, setShortName] = useState('');
  const [owner, setOwner] = useState<User | null>(null);

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      onCancel={() => {
        setOwner(null);
        setOpen(false);
        setShortName('');
        setGroupName('');
      }}
      cancelText="Close"
      onConfirm={async () => {
        if (!owner) return toast.error('Please select an owner for the group.');

        const input: CreateGroup = {
          name: groupName,
          shortName: shortName,
          membersIds: [],
          trainerIds: [owner.uid],
          institutionId: institution.id,
        };

        handleApiRequest(
          router,
          () => InstitutionController.getInstance().createGroup(input),
          (group) => {
            group = core.group.mapMembers(group, users.data);

            setInstitution({
              ...institution,
              groups: [...(institution.groups || []), group],
            });

            setOpen(false);
            setShortName('');
            setGroupName('');
            setDetectedChanges(false);
            setOwner(null);

            lib.common.indexedDb.items.put({
              id: INDEX_DB_LAST_SELECTED_DASHBOARD_GROUP_ID,
              payload: group.id,
              updatedAt: new Date().getTime(),
            });

            toast.success('Group created successfully.');
          },
          undefined,
          'Failed to create group.'
        );
      }}
    >
      <Box display="flex" justifyContent="center" alignItems="center" p={1}>
        <Typography variant="h6">Add Group</Typography>
      </Box>
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <TextField
          id="outlined-basic"
          label="Group Name"
          variant="outlined"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <TextField
          id="outlined-basic"
          size="small"
          label="Short Name"
          variant="outlined"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
        />

        <FormControl size="small" sx={{ width: '100%' }}>
          <InputLabel id="owner-select-label">Coach</InputLabel>
          <Select
            labelId="owner-select-label"
            value={owner?.uid || ''}
            onChange={(e) => {
              const trainerId = e.target.value;
              const selectedTrainer = institution.trainers.find(
                (trainer) => trainer.uid === trainerId
              );
              setOwner(selectedTrainer || null);
            }}
            sx={{ mb: 2, minWidth: 200 }}
          >
            {(institution?.trainers || []).map((trainer) => (
              <MenuItem key={trainer.uid} value={trainer.uid}>
                <Typography>{trainer.displayName}</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </MyModal>
  );
}
