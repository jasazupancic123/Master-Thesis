import MyModal from '@/common/components/modal';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import React, { ReactNode, useEffect, useState } from 'react';
import { Checkbox, Divider, FormControlLabel, InputLabel } from '@mui/material';
import Box from '@mui/material/Box';
import type { ExerciseAttribute } from '@/exercise/entity/exercise-attribute.entity';
import FileUpload from '@/common/components/file-upload';
import Stack from '@mui/material/Stack';
import { Exercise } from '@/exercise/entity/exercise.entity';
import { SetState } from '@/common/type/state.type';
import SelectAttribute from '@/exercise/components/select-attribute';
import SelectComponent from '@/exercise/components/select-component';
import { useAppContext } from '@/context/app-provider';
import { CommonService } from '@/common/service/common.service';
import { ContentState } from '@/common/enum/video-state.enum';

interface Props {
  data: Partial<Exercise>;
  setData: SetState<Partial<Exercise>>;
  attributes: ExerciseAttribute[];
  icons: ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  onFileUpload: (file: File, path: string) => Promise<void>;
}

export default function ExerciseModal(props: Props) {
  const { data, setData, attributes, isOpen, setIsOpen, icons, title } = props;

  const { components } = useAppContext();
  const [selectedComponents, setSelectedComponents] = useState<{
    [key: number]: string;
  }>({});
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<ContentState>(ContentState.NONE);
  const [imageState, setImageState] = useState<ContentState>(ContentState.NONE);

  useEffect(() => {
    // set the selected components to the data's components
    if (data.componentsIds?.length === 0) {
      setSelectedComponents({});
      return;
    }

    // for now, only one selected component is supported
    const component = components.flat.find(
      (c) => c.id === data.componentsIds![0]
    );
    if (!component) return;

    const selected: { [key: number]: string } = {};
    let level = component.parents.length;

    let parentId = component.parent;
    while (parentId) {
      const parent = components.flat.find((c) => c.id === parentId);
      if (!parent) break;

      selected[--level] = parent.id;
      parentId = parent.parent;
    }

    selected[component.parents.length] = component.id;
    setSelectedComponents(selected);

    async function fetchUrls() {
      setExistingImageUrl(null);
      setExistingVideoUrl(null);

      if (!data.imageUrl && !data.videoUrl) {
        setVideoState(ContentState.NONE);
        setImageState(ContentState.NONE);
        return;
      }

      if (data.videoUrl) setVideoState(ContentState.LOADING);
      if (data.imageUrl) setImageState(ContentState.LOADING);

      if (data.imageUrl) {
        setExistingImageUrl(
          await CommonService.instance.firebase.storage.exerciseUrl(
            data.imageUrl
          )
        );
        setImageState(ContentState.LOADED);
      } else setExistingImageUrl(null);
      if (data.videoUrl) {
        setExistingVideoUrl(
          await CommonService.instance.firebase.storage.exerciseUrl(
            data.videoUrl
          )
        );
        setVideoState(ContentState.LOADED);
      } else setExistingVideoUrl(null);
    }
    fetchUrls().then();
  }, [data?.id]);

  function handleSelectChange(field: string, value: string) {
    setData((prev) => ({
      ...prev,
      attributeValues: {
        ...prev.attributeValues,
        [field]: value,
      },
    }));
  }

  useEffect(() => {
    const componentsIds = Object.values(selectedComponents);
    if (!componentsIds.length) return;

    setData((prev) => ({
      ...prev,
      componentsIds: [componentsIds[componentsIds.length - 1]], // only the leaf component (last one) is selected
    }));
  }, [selectedComponents]);

  useEffect(() => {
    if (!isOpen) setSelectedComponents({});
  }, [isOpen]);

  return (
    <MyModal isOpen={isOpen} setIsOpen={setIsOpen} width={500}>
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

          {/* Multi-level dropdown for components */}
          <Grid xs={12}>
            <InputLabel id="component">Component</InputLabel>
            <SelectComponent
              selectedComponents={selectedComponents}
              setSelectedComponents={setSelectedComponents}
              components={components.tree}
            />
          </Grid>

          {/* Video url and image url */}
          <Grid xs={6}>
            <Stack direction="column" alignItems="center" height="100%">
              {
                // Update an existing exercise
                (() => {
                  switch (videoState) {
                    case ContentState.LOADING:
                      return (
                        <div
                          style={{
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          Loading...
                        </div>
                      );

                    default:
                      return (
                        <FileUpload
                          label="Video"
                          input="video"
                          onFileUpload={async (file: File) => {
                            const path = `media/exercise/${Date.now()}-${
                              file.name
                            }`;
                            await props.onFileUpload(file, path);
                            const url =
                              await CommonService.instance.firebase.storage.exerciseUrl(
                                path
                              );
                            setData({ ...data, videoUrl: url });
                          }}
                          initialFileUrl={
                            videoState == ContentState.LOADED &&
                            existingVideoUrl
                              ? existingVideoUrl
                              : data.videoUrl
                          }
                        />
                      );
                  }
                })()
              }

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
              {
                // Update an existing exercise
                (() => {
                  switch (imageState) {
                    case ContentState.LOADING:
                      return (
                        <div
                          style={{
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          Loading...
                        </div>
                      );

                    default:
                      return (
                        <FileUpload
                          label="Image"
                          input="image"
                          onFileUpload={async (file: File) => {
                            const path = `media/exercise/${Date.now()}-${
                              file.name
                            }`;
                            await props.onFileUpload(file, path);
                            const url =
                              await CommonService.instance.firebase.storage.exerciseUrl(
                                path
                              );
                            setData({ ...data, imageUrl: url });
                          }}
                          initialFileUrl={
                            imageState == ContentState.LOADED &&
                            existingImageUrl
                              ? existingImageUrl
                              : data.imageUrl
                          }
                        />
                      );
                  }
                })()
              }
              {/* <FileUpload
                label="Image"
                input="image"
                onFileUpload={async (file: File) => {
                  const path = `media/exercise/${Date.now()}-${file.name}`;
                  setData({ ...data, imageUrl: path });

                  await props.onFileUpload(file, path);
                }}
                initialFileUrl={
                  existingImageUrl === null ? data.imageUrl : existingImageUrl
                }
                // fileUrl={data.imageUrl}
                // setFileUrl={(url) => setData({ ...data, imageUrl: url })}
              /> */}

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
            const type =
              attribute.type === 'number'
                ? 'number'
                : attribute.type === 'date'
                ? 'date'
                : 'text';

            return (
              <Grid xs={6} key={attribute.field}>
                {attribute.type === 'select' ? (
                  <SelectAttribute
                    attribute={attribute}
                    onChange={handleSelectChange}
                    initialValue={data.attributeValues}
                    label
                  />
                ) : attribute.type === 'boolean' ? (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          data.attributeValues?.[attribute.field] || false
                        }
                        onChange={(e) =>
                          handleSelectChange(
                            attribute.field,
                            e.target.checked as any
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
                    value={data.attributeValues?.[attribute.field] || ''}
                    onChange={(e) =>
                      handleSelectChange(attribute.field, e.target.value)
                    }
                  />
                )}
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </MyModal>
  );
}
