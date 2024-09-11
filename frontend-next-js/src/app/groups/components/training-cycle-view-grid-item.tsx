import { Training } from '@/training/entity/training.entity';
import { Component } from '@/component/entity/component.entity';
import { useAppContext } from '@/context/app-provider';
import { AppContextType } from '@/common/type/context.type';
import Box from '@mui/material/Box';
import { Divider } from '@mui/material';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ExerciseChips from '@/exercise/components/exercise-chips';
import { AddCircle } from '@mui/icons-material';
import React from 'react';
import { CreateTrainingComponent } from '@/training/type/training-component.type';
import { CommonService } from '@/common/service/common.service';
import toast from 'react-hot-toast';

interface Props {
  training: Training;
  components: Component[];
  addTrainingComponent: (trainingId: string, data: CreateTrainingComponent[]) => void,
  order: number;
}

export function TrainingGridItem(props: Props) {
  const { components } = useAppContext() as AppContextType;
  const training = CommonService.instance.firebase.firestore.populateTraining(props.training, components.flat);

  return <Box px={1}>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Box sx={{ flex: 1 }}>
        <Divider />

        <Typography variant="caption" color="primary" fontSize={12}>
          Training #{props.order}
        </Typography>
      </Box>

      <IconButton size="small" onClick={async (e) => {
        e.stopPropagation();
        toast('TODO delete training');
      }}>
        <DeleteIcon />
      </IconButton>
    </Box>

    <ExerciseChips
      components={training.components.map((component) => component.component)}
      itemSx={{ fontSize: 10, cursor: 'default' }}
      direction="column"
      small
    />

    {/* Add training component icon */}
    {props.components.length > 0 && <>
      <IconButton
        size="small"
        onClick={() => props.addTrainingComponent(
          training.id,
          props.components.map((c, i) => ({ componentId: c.id, order: i })),
        )}
      >
        <AddCircle />
      </IconButton>
    </>}
  </Box>;
}