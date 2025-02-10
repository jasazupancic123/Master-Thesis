import Box from '@mui/material/Box';
import { Divider } from '@mui/material';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { AddCircle } from '@mui/icons-material';
import React from 'react';
import { TrainingCycleViewGridItemProps } from './type';

export function TrainingGridItem(props: TrainingCycleViewGridItemProps) {
  const { training } = props;

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
          <div key={component!.id}>
            <IconButton
              size="small"
              onClick={async (e) => {
                e.stopPropagation();
                await props.deleteTrainingComponent(training.id, component!.id);
              }}
            >
              <Typography variant="caption">{component!.name}</Typography>
              <DeleteIcon />
            </IconButton>
          </div>
        ))}
      </>

      {/* add training component icon */}
      {props.components.length > 0 && (
        <>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              props.addTrainingComponent(training.id, {
                components: props.components.map((c, i) => ({
                  id: c.id,
                  order: i,
                })),
              });
            }}
          >
            <AddCircle />
          </IconButton>
        </>
      )}
    </Box>
  );
}
