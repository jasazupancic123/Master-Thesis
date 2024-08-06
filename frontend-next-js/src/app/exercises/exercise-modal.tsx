import MyModal from '@/component/modal';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import Select from '@mui/material/Select';
import React, { ReactNode } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { Divider, InputLabel } from '@mui/material';
import { ComponentWithParents } from '@/type/component.type';
import { Prescription } from '@/enum/prescription.enum';
import SelectEnum from '@/component/select-enum';
import { Priority } from '@/enum/priority.enum';
import { Method } from '@/enum/method.enum';
import { LoadingSide } from '@/enum/loading-side.enum';
import { BodyRegion } from '@/enum/body-region.enum';
import { MovementDirection } from '@/enum/movement-direction.enum';
import { Diagnosis } from '@/enum/diagnosis.enum';
import { Muscle } from '@/enum/muscle.enum';
import { SportTask } from '@/enum/sport-task.enum';
import Box from '@mui/material/Box';
import type { Exercise } from '@/type/exercise.type';

interface ExerciseModalProps {
  data: Partial<Exercise>;
  setData: (data: Partial<Exercise>) => void;
  components: ComponentWithParents[];
  icons: ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
}

export default function ExerciseModal(props: ExerciseModalProps) {
  const {
    data,
    setData,
    components,
    isOpen,
    setIsOpen,
    icons,
    title,
  } = props;

  return <MyModal isOpen={isOpen} setIsOpen={setIsOpen} width={500}>
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5">{title}</Typography>
        <Box>{icons}</Box>
      </Box>

      <Grid container spacing={2}>
        {/* Name */}
        <Grid xs={12}>
          <TextField
            fullWidth
            label="Name"
            variant="outlined"
            autoFocus
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />
        </Grid>

        {/* Video url and image url */}
        <Grid xs={6}>
          <TextField
            fullWidth
            label="Video URL"
            variant="outlined"
            value={data.videoUrl}
            onChange={(e) => setData({ ...data, videoUrl: e.target.value })}
          />
        </Grid>

        <Grid xs={6}>
          <TextField
            fullWidth
            label="Image URL"
            variant="outlined"
            value={data.imageUrl}
            onChange={(e) => setData({ ...data, imageUrl: e.target.value })}
          />
        </Grid>

        <Grid xs={12}>
          <InputLabel id="component">Component</InputLabel>
          <Select
            labelId="component"
            label="Component"
            variant="outlined"
            fullWidth
            value={data.componentIds?.[0] || ''}
            onChange={(e) => setData({ ...data, componentIds: [e.target.value] as string[] })}
          >
            <MenuItem value={''}>None</MenuItem>
            {components.map((component) => (
              <MenuItem key={component.id} value={component.id}>
                {component.parents.map((parent) => parent.name).join(' > ')} {'>'} {component.name}
              </MenuItem>
            ))}
          </Select>
        </Grid>

        <Grid xs={12}>
          <Divider>Extras</Divider>
        </Grid>

        <Grid xs={6}>
          <SelectEnum
            enumObject={Prescription}
            label={'Prescription'}
            value={data.prescription || ''}
            onChange={(value) => setData({ ...data, prescription: value })}
          />
        </Grid>

        <Grid xs={6}>
          <SelectEnum
            enumObject={Priority}
            label={'Priority'}
            value={data.priority || ''}
            onChange={(value) => setData({ ...data, priority: value })}
          />
        </Grid>

        <Grid xs={6}>
          <SelectEnum
            enumObject={Method}
            label={'Method'}
            value={data.method || ''}
            onChange={(value) => setData({ ...data, method: value })}
          />
        </Grid>

        <Grid xs={6}>
          <SelectEnum
            enumObject={LoadingSide}
            label={'Loading Side'}
            value={data.loadingSide || ''}
            onChange={(value) => setData({ ...data, loadingSide: value })}
          />
        </Grid>

        <Grid xs={6}>
          <SelectEnum
            enumObject={BodyRegion}
            label={'Body Region'}
            value={data.bodyRegion || ''}
            onChange={(value) => setData({ ...data, bodyRegion: value })}
          />
        </Grid>

        <Grid xs={6}>
          <SelectEnum
            enumObject={MovementDirection}
            label={'Movement Direction'}
            value={data.movementDirection || ''}
            onChange={(value) => setData({ ...data, movementDirection: value })}
          />
        </Grid>

        <Grid xs={6}>
          <SelectEnum
            enumObject={Diagnosis}
            label={'Diagnosis'}
            value={data.diagnosis || ''}
            onChange={(value) => setData({ ...data, diagnosis: value })}
          />
        </Grid>

        <Grid xs={6}>
          <SelectEnum
            enumObject={Diagnosis}
            label={'Diagnosis'}
            value={data.diagnosis || ''}
            onChange={(value) => setData({ ...data, diagnosis: value })}
          />
        </Grid>

        <Grid xs={4}>
          <TextField
            fullWidth
            type="number"
            label="Coefficient 1"
            variant="outlined"
            value={data.coefficient1 || ''}
            onChange={(e) => setData({ ...data, coefficient1: +e.target.value })}
          />
        </Grid>

        <Grid xs={4}>
          <TextField
            fullWidth
            type="number"
            label="Coefficient 2"
            variant="outlined"
            value={data.coefficient2 || ''}
            onChange={(e) => setData({ ...data, coefficient2: +e.target.value })}
          />
        </Grid>

        <Grid xs={4}>
          <TextField
            fullWidth
            type="number"
            label="Coefficient 3"
            variant="outlined"
            value={data.coefficient3 || ''}
            onChange={(e) => setData({ ...data, coefficient3: +e.target.value })}
          />
        </Grid>

        <Grid xs={6}>
          <SelectEnum
            enumObject={Muscle}
            label={'Muscle'}
            value={data.muscle || ''}
            onChange={(value) => setData({ ...data, muscle: value })}
          />
        </Grid>

        <Grid xs={6}>
          <SelectEnum
            enumObject={SportTask}
            label={'Sport Task'}
            value={data.sportTask || ''}
            onChange={(value) => setData({ ...data, sportTask: value })}
          />
        </Grid>

        <Grid xs={12}>
          <SelectEnum
            enumObject={Location}
            label={'Location'}
            value={data.location || ''}
            onChange={(value) => setData({ ...data, location: value })}
          />
        </Grid>
      </Grid>
    </Box>
  </MyModal>;
}