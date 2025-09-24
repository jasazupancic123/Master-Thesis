import { Checkbox, Divider, FormControlLabel, InputLabel } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import SelectAttribute from '../select-attribute/select-attribute';
import SelectComponent from '../select-component/select-component';
import { FirebaseStorageUtil } from '@/common/firebase/firebase-storage.util';
import { CommonService } from '@/common/service/common.service';
import type { SetState } from '@/common/type/state.type';
import FileUpload from '@/components/file-upload/file-upload';
import MyModal from '@/components/modal/modal';
import { AttributeType } from '@/controller/attribute/enum/attribute-value.enum';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import { useScreenSize } from '@/store/screen-size.provider';

const firebaseStorage = FirebaseStorageUtil.Instance;

interface Props {
  data: Partial<Exercise>;
  setData: SetState<Partial<Exercise>>;
  attributes: Attribute[];
  components: Component[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  cancelText?: string;
  onDelete?: () => void;
  onConfirm?: (filteredAttributes: Attribute[]) => Promise<void>;
}

export default function ExerciseModal(props: Props) {
  const screenSize = useScreenSize();
  const {
    data,
    setData,
    attributes,
    components,
    isOpen,
    setIsOpen,
    title,
    cancelText,
    onDelete,
    onConfirm,
  } = props;

  const [selectedComponents, setSelectedComponents] = useState<{
    [key: number]: string;
  }>({});

  const [hasSelectedLeafComponent, setHasSelectedLeafComponent] =
    useState(false);

  const [filteredAttributes, setFilteredAttributes] = useState(attributes);

  function handleSelectChange(field: string, value: string) {
    setData((prev) => ({
      ...prev,
      valuesObject: {
        ...prev.valuesObject,
        [field]: value,
      },
    }));
  }

  useEffect(() => {
    // set the selected components to the data's components
    if (data.componentIds?.length === 0) {
      setSelectedComponents({});
      return;
    }

    // for now, only one selected component is supported
    const component = components.find((c) => c.id === data.componentIds![0]);
    if (!component) return;

    const selected: { [key: number]: string } = {};
    let level = component.parents.length;

    let parentId = component.parentId;
    while (parentId) {
      const parent = components.find((c) => c.id === parentId);
      if (!parent) break;

      selected[--level] = parent.id;
      parentId = parent.parentId;
    }

    selected[component.parents.length] = component.id;
    setSelectedComponents(selected);
  }, [data?.id]);

  useEffect(() => {
    const componentsIds = Object.values(selectedComponents);
    if (!componentsIds.length) return;

    setData((prev) => ({
      ...prev,
      componentIds: [
        componentsIds[componentsIds.length - 1] || componentsIds[0],
      ], // only the leaf component (last one) is selected
    }));
  }, [selectedComponents]);

  useEffect(() => {
    const componentId = data.componentIds?.[0];
    if (!componentId) return;

    const foundComponent = components.find((c) => c.id === componentId);
    if (!foundComponent) return;

    const hasSelectedLeafComponent = foundComponent.children.length === 0;
    if (!hasSelectedLeafComponent) setFilteredAttributes([]);

    const parents = foundComponent.parents.map((parent) =>
      components.find((c) => c.id === parent)
    );

    const attributeIds = foundComponent.attributes || [];
    for (const parent of parents)
      if (parent?.attributes)
        for (const attribute of parent.attributes)
          if (!attributeIds.find((a) => a === attribute))
            attributeIds.push(attribute);

    setFilteredAttributes(
      attributes.filter((a) => attributeIds.includes(a.field))
    );

    setHasSelectedLeafComponent(hasSelectedLeafComponent);
  }, [data.componentIds]);

  useEffect(() => {
    if (!isOpen) setSelectedComponents({});
  }, [isOpen]);

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
            <InputLabel id="component">Component</InputLabel>
            <SelectComponent
              selectedComponents={selectedComponents}
              setSelectedComponents={setSelectedComponents}
              components={
                CommonService.instance.tree.fromArray(components, {
                  idPropertyName: 'id',
                  parentIdPropertyName: 'parentId',
                  childrenPropertyName: 'children',
                }) as unknown as TreeComponent[]
              }
            />
          </Grid>

          {/* Video url and image url */}
          <Grid size={{ xs: 6 }}>
            <Stack direction="column" alignItems="center" height="100%">
              <FileUpload
                label="Video"
                input="video"
                initialFileUrl={data.videoUrl}
                onFileUpload={async (file: File) => {
                  const path = `media/exercise/${Date.now()}-${file.name}`;
                  const url = await firebaseStorage.uploadFile(file, path);
                  setData((prev) => ({ ...prev, videoUrl: url }));
                }}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Stack direction="column" alignItems="center">
              <FileUpload
                label="Image"
                input="image"
                initialFileUrl={data.imageUrl}
                onFileUpload={async (file: File) => {
                  const path = `media/exercise/${Date.now()}-${file.name}`;
                  const url = await firebaseStorage.uploadFile(file, path);
                  setData((prev) => ({ ...prev, imageUrl: url }));
                }}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <FormControlLabel
              label={'Bilateral'}
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

          <Grid size={{ xs: 12 }}>
            <Divider>Other</Divider>
          </Grid>

          {!hasSelectedLeafComponent ? (
            <Box width="100%" display="flex" justifyContent="center">
              Select a leaf component to add attributes
            </Box>
          ) : filteredAttributes.length === 0 ? (
            <Box width="100%" display="flex" justifyContent="center">
              No attributes to set
            </Box>
          ) : (
            filteredAttributes.map((attribute) => {
              const type =
                attribute.type === AttributeType.Number ? 'number' : 'text';

              return (
                <Grid size={{ xs: 6 }} key={attribute.field}>
                  {attribute.type === 'select' ||
                  attribute.type === 'multiselect' ? (
                    <SelectAttribute
                      attribute={attribute}
                      onChange={handleSelectChange}
                      initialValue={data.valuesObject}
                      label
                    />
                  ) : attribute.type === 'boolean' ? (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            typeof data.valuesObject?.[attribute.field] ===
                            'boolean'
                              ? (data.valuesObject[attribute.field] as boolean)
                              : false
                          }
                          onChange={(e) =>
                            handleSelectChange(
                              attribute.field,
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
                      value={data.valuesObject?.[attribute.field] || ''}
                      onChange={(e) =>
                        handleSelectChange(attribute.field, e.target.value)
                      }
                    />
                  )}
                </Grid>
              );
            })
          )}
        </Grid>
      </Box>
    </MyModal>
  );
}
