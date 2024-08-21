import MyModal from '@/component/modal';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import React, { ReactNode, useEffect, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { Checkbox, Divider, FormControl, FormControlLabel, InputLabel } from '@mui/material';
import { ComponentWithParents } from '@/type/component.type';
import Box from '@mui/material/Box';
import type { CreateExercise, ExerciseAttributeSelectOption } from '@/type/exercise.type';
import { ExerciseAttribute } from '@/type/exercise.type';

interface ExerciseModalProps {
  data: CreateExercise;
  setData: (data: CreateExercise | ((prev: CreateExercise) => CreateExercise)) => void;
  attributes: ExerciseAttribute[];
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
    attributes,
    components,
    isOpen,
    setIsOpen,
    icons,
    title,
  } = props;

  function handleSelectChange(field: string, value: string) {
    setData(prev => ({
      ...prev,
      attributeValues: {
        ...prev.attributeValues,
        [field]: value,
      },
    }));
  }

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
            fullWidth
            labelId="component"
            label="Component"
            variant="outlined"
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

        {attributes.map((attribute) => {
          const type = attribute.type === 'number'
            ? 'number'
            : attribute.type === 'date'
              ? 'date'
              : 'text';

          return <Grid xs={6} key={attribute.id}>
            {attribute.type === 'select'
              ? <SelectAttribute
                attribute={attribute}
                onChange={handleSelectChange}
                initialValue={data.attributeValues}
                label
              />
              : attribute.type === 'boolean'
                ?
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={data.attributeValues?.[attribute.field] || false}
                      onChange={(e) => handleSelectChange(attribute.field, e.target.checked)}
                    />
                  }
                  label={attribute.name}
                />
                : <TextField
                  fullWidth
                  label={attribute.name}
                  type={type}
                  variant="outlined"
                  value={data.attributeValues?.[attribute.field] || ''}
                  onChange={(e) => handleSelectChange(attribute.field, e.target.value)}
                />}
          </Grid>;
        })}

        {/*<Grid xs={6}>
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
        </Grid>*/}
      </Grid>
    </Box>
  </MyModal>;
}

// recursive component to show select for subattributes
function SelectAttribute(props: {
  attribute: ExerciseAttribute | ExerciseAttributeSelectOption;
  onChange: (field: string, value: string) => void;
  initialValue?: string | Record<string, any>;
  label?: boolean
}) {
  const { attribute, onChange, initialValue, label } = props;

  const [subOptions, setSubOptions] = useState<ExerciseAttributeSelectOption | undefined>(undefined);
  const [selectedValue, setSelectedValue] = useState<string | undefined>(() => {
    if (typeof initialValue === 'object')
      return initialValue[attribute.field] as string;

    return initialValue as string;
  });

  /**
   * Populate initial values for nested select
   */
  useEffect(() => {
    if (typeof initialValue === 'object' && initialValue[attribute.field]) {
      setSelectedValue(initialValue[attribute.field] as string);

      const selectedOption = attribute.values?.find((option) =>
        typeof option === 'object' && option.field === initialValue[attribute.field],
      ) as ExerciseAttributeSelectOption;

      setSubOptions(selectedOption);
    }
  }, [initialValue]);

  function handleSelectChange(e: SelectChangeEvent) {
    const value = e.target.value as string;
    setSelectedValue(value);

    const selectedOption = attribute.values?.find((option) =>
      typeof option === 'object' && option.field === value,
    ) as ExerciseAttributeSelectOption;

    setSubOptions(selectedOption);
    onChange(attribute.field, value);
  }

  return <Box>
    <FormControl fullWidth>
      {label && <InputLabel id={attribute.field}>{attribute.name}</InputLabel>}
      <Select
        labelId={attribute.field}
        label={label ? attribute.name : undefined}
        variant="outlined"
        fullWidth
        value={selectedValue || ''}
        onChange={handleSelectChange}
      >
        <MenuItem value="">None</MenuItem>

        {attribute.values?.map((option) => {
          if (typeof option === 'string')
            return <MenuItem key={option} value={option}>{option}</MenuItem>;

          // nested select
          return <MenuItem key={option.field} value={option.field}>
            {option.name}
          </MenuItem>;
        })}
      </Select>
    </FormControl>

    {subOptions && <SelectAttribute
      attribute={subOptions}
      onChange={onChange}
      initialValue={initialValue}
    />}
  </Box>;
}