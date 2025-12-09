import { Checkbox, Divider, FormControlLabel } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';

import FlatSelectAttribute from './flat-select-attribute';
import { AttributeType } from '@/core/attribute/enum/attribute-value.enum';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import { core } from '@/core/core.service';
import { Components } from '@/core/exercise/constant/components.constant';
import type {
  Exercise,
  ExerciseAttributes,
} from '@/core/exercise/type/exercise.type';
import { lib } from '@/lib';
import { InputType } from '@/lib/common/const/input-type.const';
import type { SetState } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import FileUpload from '@/ui/file-upload';
import MyModal from '@/ui/modal';

interface Props {
  data: Partial<Exercise>;
  setData: SetState<Partial<Exercise>>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  cancelText?: string;
  onDelete?: () => void;
  onConfirm?: (filteredAttributes: Attribute[]) => Promise<void>;
}

export default function ExerciseModal({
  data,
  setData,
  isOpen,
  setIsOpen,
  title,
  cancelText,
  onDelete,
  onConfirm,
}: Props) {
  const { role } = useAuthenticatedAuth();
  const screenSize = useScreenSize();

  const [filteredAttributes, setFilteredAttributes] = useState<Attribute[]>([]);

  function handleSelectChange(
    field: keyof Exercise,
    value: string | string[] | boolean
  ) {
    setData((prev) => {
      let newValue = value;

      // normalize select/multiselect into string[]
      if (Array.isArray(value)) newValue = value;
      else if (typeof value === 'string' && prev?.[field] instanceof Array)
        newValue = [value];

      return { ...prev, [field]: newValue };
    });
  }

  function handleCoefficientChange(
    field: keyof Exercise,
    min: number,
    max: number,
    value: string
  ) {
    let val = parseFloat(value);
    if (val < min) val = min;
    if (val > max) val = max;

    setData((prev) => ({ ...prev, [field]: val }));
  }

  useEffect(() => {
    const attributes: string[] = [];
    const mainComponent = data?.components?.[0]?.split(':')?.[0];

    if (mainComponent) {
      lib.common.tree.traverse(
        mainComponent,
        Components,
        'field',
        'options',
        (a) => {
          attributes.push(...(a.attributes || []));
        }
      );
    }

    setFilteredAttributes(
      core.exercise.attribute
        .getAll(attributes)
        .filter((a) => a.field !== 'components')
    );
  }, [data?.id, data.components]);

  return (
    <MyModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      width={screenSize.isMobile ? undefined : 500}
      onConfirm={() => onConfirm?.(filteredAttributes)}
      onDelete={onDelete}
      cancelText={cancelText}
    >
      <Box p={1}>
        <Box display="flex" justifyContent="space-between" mb={3}>
          <Typography variant="h5">{title}</Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Name */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Name"
              variant="outlined"
              autoFocus
              value={data.name}
              onChange={(e) =>
                setData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </Grid>

          {/* Multi-level dropdown for components */}
          <Grid size={{ xs: 12 }}>
            <FlatSelectAttribute
              attribute={{
                field: 'components',
                name: 'Components',
                options: Components,
              }}
              initialValue={data?.components}
              label
              onChange={(field, values) =>
                handleSelectChange(field as keyof Exercise, values)
              }
            />
          </Grid>

          {/* Video url and image url */}
          <Grid size={{ xs: 6 }}>
            <Stack direction="column" alignItems="center" height="100%">
              <FileUpload
                label="Video"
                input={InputType.VIDEO}
                initialFileUrl={data.videoUrl}
                onFileUpload={async (file: File) => {
                  const path = `media/exercise/${Date.now()}-${file.name}`;
                  const url = await lib.firebase.storage.uploadFile(file, path);
                  setData((prev) => ({ ...prev, videoUrl: url }));
                }}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Stack direction="column" alignItems="center">
              <FileUpload
                label="Image"
                input={InputType.IMAGE}
                initialFileUrl={data.imageUrl}
                onFileUpload={async (file: File) => {
                  const path = `media/exercise/${Date.now()}-${file.name}`;
                  const url = await lib.firebase.storage.uploadFile(file, path);
                  setData((prev) => ({ ...prev, imageUrl: url }));
                }}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <FormControlLabel
              label={'Unilateral'}
              control={
                <Checkbox
                  checked={data.isUnilateral || false}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      isUnilateral: e.target.checked,
                    }))
                  }
                />
              }
            />
          </Grid>

          {lib.firebase.auth.isAdmin(role) && (
            <Grid size={{ xs: 6 }}>
              <FormControlLabel
                label={'Disabled'}
                control={
                  <Checkbox
                    checked={data.disabled || false}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        disabled: e.target.checked,
                      }))
                    }
                  />
                }
              />
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <Divider>Other</Divider>
          </Grid>

          {filteredAttributes.length === 0 ? (
            <Box width="100%" display="flex" justifyContent="center">
              No attributes to set
            </Box>
          ) : (
            filteredAttributes.map((attribute) => {
              const type =
                attribute.type === AttributeType.Number ? 'number' : 'text';

              return (
                <Grid size={{ xs: 6 }} key={attribute.field as string}>
                  {attribute.type === 'select' ||
                  attribute.type === 'multiselect' ? (
                    <FlatSelectAttribute
                      attribute={attribute}
                      onChange={(field, values) =>
                        handleSelectChange(field as keyof Exercise, values)
                      }
                      initialValue={
                        data?.[attribute.field as keyof Exercise] as string[]
                      }
                      label
                    />
                  ) : attribute.type === 'boolean' ? (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            typeof data?.[attribute.field as keyof Exercise] ===
                            'boolean'
                              ? (data[
                                  attribute.field as keyof Exercise
                                ] as unknown as boolean)
                              : false
                          }
                          onChange={(e) =>
                            handleSelectChange(
                              attribute.field as keyof ExerciseAttributes,
                              e.target.checked ? 'true' : 'false'
                            )
                          }
                        />
                      }
                      label={attribute.name}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      label={attribute.name}
                      type={type}
                      variant="outlined"
                      value={
                        data?.[attribute.field as keyof ExerciseAttributes] ||
                        ''
                      }
                      onChange={(e) =>
                        handleSelectChange(
                          attribute.field as keyof ExerciseAttributes,
                          e.target.value
                        )
                      }
                    />
                  )}
                </Grid>
              );
            })
          )}

          <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
            <Divider>Coefficients</Divider>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Main Exercise Relation Coefficient"
              type="number"
              variant="outlined"
              inputProps={{ step: '0.1' }}
              value={data.coeffRel || ''}
              onChange={(e) => {
                handleCoefficientChange('coeffRel', 0, 2, e.target.value);
              }}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Training Load Coefficient"
              type="number"
              variant="outlined"
              inputProps={{ step: '0.1' }}
              value={data.coeffLoad || ''}
              onChange={(e) => {
                handleCoefficientChange('coeffLoad', 0, 1, e.target.value);
              }}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Bodyweight Intensity Coefficient"
              type="number"
              variant="outlined"
              inputProps={{ step: '0.1' }}
              value={data.coeffBw || ''}
              onChange={(e) => {
                handleCoefficientChange('coeffBw', 0, 1, e.target.value);
              }}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Rep Max Intensity Coefficient"
              type="number"
              variant="outlined"
              inputProps={{ step: '0.1' }}
              value={data.coeff1Rm || ''}
              onChange={(e) => {
                handleCoefficientChange('coeff1Rm', 0, 4, e.target.value);
              }}
            />
          </Grid>
        </Grid>
      </Box>
    </MyModal>
  );
}
