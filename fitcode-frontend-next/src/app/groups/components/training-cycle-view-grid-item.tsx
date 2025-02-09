import { useAppContext } from '@/context/app-provider';
import { AppContextType } from '@/common/type/context.type';
import Box from '@mui/material/Box';
import { Button, Divider } from '@mui/material';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { AddCircle } from '@mui/icons-material';
import React from 'react';
import { CommonService } from '@/common/service/common.service';
import { Component } from '@/controller/component/type/component.type';
import { Training } from '@/controller/training/type/training.type';
import { TrainingService } from '@/controller/training/training.service';

interface Props {
  training: Training;
  components: Component[];
  order: number;
  addTrainingComponent: (trainingId: string, data: any[]) => void;
  deleteTraining: (trainingId: string) => Promise<void>;
  deleteTrainingComponent: (
    trainingId: string,
    componentId: string
  ) => Promise<void>;
}

export function TrainingGridItem(props: Props) {
  const { components } = useAppContext() as AppContextType;
  const training = props.training;
  TrainingService.mapComponents(training, components.flat);

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
        {Object.values(training.components).map(({ component }) => (
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
