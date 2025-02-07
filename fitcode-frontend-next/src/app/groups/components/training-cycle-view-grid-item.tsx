import { Training } from '@/training/entity/training.entity';
import { Component } from '@/component/entity/component.entity';
import { useAppContext } from '@/context/app-provider';
import { AppContextType } from '@/common/type/context.type';
import Box from '@mui/material/Box';
import { Button, Divider } from '@mui/material';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ExerciseChips from '@/exercise/components/exercise-chips';
import { AddCircle } from '@mui/icons-material';
import React from 'react';
import { CreateTrainingComponent } from '@/training/type/training-component.type';
import { CommonService } from '@/common/service/common.service';
import { TrainingService } from '@/training/training.service';

interface Props {
  training: Training;
  components: Component[];
  order: number;
  addTrainingComponent: (
    trainingId: string,
    data: CreateTrainingComponent[]
  ) => void;
  deleteTraining: (trainingId: string) => Promise<void>;
  deleteTrainingComponent: (
    trainingId: string,
    componentId: string
  ) => Promise<void>;
}

export function TrainingGridItem(props: Props) {
  const { components } = useAppContext() as AppContextType;
  const training = TrainingService.map(props.training, components.flat);
  console.log('training.components', training.components);

  return (
    <Box px={1}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box sx={{ flex: 1 }}>
          <Divider />

          <Typography variant="caption" color="primary" fontSize={12}>
            Training #{props.order}
          </Typography>
        </Box>

        <IconButton
          size="small"
          onClick={async (e) => {
            e.stopPropagation();
            await props.deleteTraining(training.id);
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      <>
        {training.components.map(({ component }) => (
          <div key={component.id}>
            <IconButton
              size="small"
              onClick={async (e) => {
                e.stopPropagation();
                await props.deleteTrainingComponent(training.id, component.id);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </div>
        ))}
      </>

      {/* Add training component icon */}
      {props.components.length > 0 && (
        <>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              props.addTrainingComponent(
                training.id,
                props.components.map((c, i) => ({
                  id: c.id,
                  order: i,
                }))
              );
            }}
          >
            <AddCircle />
          </IconButton>
        </>
      )}
    </Box>
  );
}
