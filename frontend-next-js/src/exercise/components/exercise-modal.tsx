import MyModal from '@/common/components/modal';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import React, { ReactNode, useEffect, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { Checkbox, Divider, FormControl, FormControlLabel, InputLabel } from '@mui/material';
import Box from '@mui/material/Box';
import type { ExerciseAttribute, ExerciseAttributeSelectOption } from '@/exercise/entity/exercise-attribute.entity';
import type { CreateExercise } from '@/exercise/type/exercise.type';
import FileUpload from '@/common/components/file-upload';
import Stack from '@mui/material/Stack';
import { FirebaseStorageUtil } from '@/common/service/util/firebase-storage.util';
import { Component } from '@/component/entity/component.entity';
import { CommonService } from '@/common/service/common.service';

interface Props {
  data: CreateExercise;
  setData: (data: CreateExercise | ((prev: CreateExercise) => CreateExercise)) => void;
  attributes: ExerciseAttribute[];
  components: Component[];
  icons: ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  onFileUpload: (file: File, path: string) => Promise<void>;
}

export default function ExerciseModal(props: Props) {
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
    setData((prev) => ({
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

        <Grid xs={12}>
          <InputLabel id="component">Component</InputLabel>
          <Select
            fullWidth
            labelId="component"
            label="Component"
            variant="outlined"
            value={data.componentsIds?.[0] || ''}
            onChange={(e) => setData({ ...data, componentsIds: [e.target.value] as string[] })}
          >
            <MenuItem value={''}>None</MenuItem>
            {components.map((component) => (
              <MenuItem key={component.id} value={component.id}>
                {component.parents.map((parent) => parent.name).join(' > ')} {'>'} {component.name}
              </MenuItem>
            ))}
          </Select>
        </Grid>

        {/* Video url and image url */}
        <Grid xs={6}>
          <Stack direction="column" alignItems="center">
            <FileUpload
              label="Video"
              input="video"
              onFileUpload={async (file: File) => {
                const path = `media/exercise/${Date.now()}-${file.name}`;
                setData({ ...data, videoUrl: path });

                await props.onFileUpload(file, path);
              }}
              initialFileUrl={
                data.videoUrl ? FirebaseStorageUtil.exerciseUrl(CommonService.instance.navigation.getFilenameFromPath(data.videoUrl)) : undefined
              }
            />

            {/*<TextField
              fullWidth
              label="Or paste video URL"
              variant="outlined"
              value={data.videoUrl || ''}
              onChange={(e) => setData({ ...data, videoUrl: e.target.value })}
            />*/}
          </Stack>
        </Grid>

        <Grid xs={6}>
          <Stack direction="column" alignItems="center">
            <FileUpload
              label="Image"
              input="image"
              onFileUpload={async (file: File) => {
                const path = `media/exercise/${Date.now()}-${file.name}`;
                setData({ ...data, imageUrl: path });

                await props.onFileUpload(file, path);
              }}
              initialFileUrl={
                data.imageUrl ? FirebaseStorageUtil.exerciseUrl(CommonService.instance.navigation.getFilenameFromPath(data.imageUrl)) : undefined
              }
              // fileUrl={data.imageUrl}
              // setFileUrl={(url) => setData({ ...data, imageUrl: url })}
            />

            {/*<TextField
              fullWidth
              label="Or paste image URL"
              variant="outlined"
              value={data.imageUrl || ''}
              onChange={(e) => setData({ ...data, imageUrl: e.target.value })}
            />*/}
          </Stack>
        </Grid>

        <Grid xs={12}>
          <Divider>Other</Divider>
        </Grid>

        {attributes.map((attribute) => {
          const type = attribute.type === 'number'
            ? 'number'
            : attribute.type === 'date'
              ? 'date'
              : 'text';

          return <Grid xs={6} key={attribute.field}>
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
                      onChange={(e) => handleSelectChange(attribute.field, e.target.checked as any)}
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
      </Grid>
    </Box>
  </MyModal>;
}

// recursive components to show select for subattributes
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
  }, [attribute.field, attribute.values, initialValue]);

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