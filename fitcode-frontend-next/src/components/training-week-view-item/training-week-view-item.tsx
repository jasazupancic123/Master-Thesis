'use client';

import { Box, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import MyModal from '../modal/modal';
import TrainerWeekViewItem from '../training-week-component-item/training-week-component-item';
import { handleApiRequest } from '@/common/type/state.type';
import type { GroupEvent } from '@/controller/group/type/group-event.type';
import { TrainingController } from '@/controller/training/training.controller';
import type { TrainingComponentWithTrainingId } from '@/controller/training/type/training-component.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';

export type WeekViewItemProps = {
  item: TrainingComponentWithTrainingId | GroupEvent;
};

export default function WeekViewItem(props: WeekViewItemProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();
  const { token } = useAuthenticatedAuth();

  const { item } = props;
  const { group, setGroup, trainings, setTrainings } = useGroup();

  const checkIsTrainingComponent = (
    item: TrainingComponentWithTrainingId | GroupEvent
  ): item is TrainingComponentWithTrainingId => {
    return (item as TrainingComponentWithTrainingId).supersets !== undefined;
  };

  const isTrainingComponent = checkIsTrainingComponent(item);
  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    (TrainingComponentWithTrainingId | GroupEvent) | null
  >(null);

  async function handleUpdateTrainingTimes(
    newItem: TrainingComponentWithTrainingId | GroupEvent
  ) {
    if (!isTrainingComponent || !selectedItem) return;

    await handleApiRequest(
      router,
      () =>
        TrainingController.getInstance(token).updateComponentTime(
          item.trainingId,
          selectedItem.id,
          { from: newItem.from, to: newItem.to }
        ),
      (result) => {
        setSelectedItem((prev) => (prev ? newItem : null));

        if (checkIsTrainingComponent(newItem))
          setTrainings((prev) =>
            prev.map((t) =>
              t.id === item.trainingId
                ? {
                    ...t,
                    components: result.components
                      ? result.components.map((c) => {
                          const found = t.components.find(
                            (tc) => tc.id === c.id
                          )!;

                          return { ...found, from: c.from, to: c.to };
                        })
                      : t.components,
                    warmup: result.warmup
                      ? {
                          ...t.warmup,
                          from: result.warmup.from,
                          to: result.warmup.to,
                        }
                      : t.warmup,
                    cooldown: result.cooldown
                      ? {
                          ...t.cooldown,
                          from: result.cooldown.from,
                          to: result.cooldown.to,
                        }
                      : t.cooldown,
                    from: result.from || t.from,
                    to: result.to || t.to,
                  }
                : t
            )
          );
        else
          setGroup((prev) => ({
            ...prev,
            events: prev.events?.map((ev) =>
              ev.id === newItem.id ? newItem : ev
            ),
          }));
      },
      (e) =>
        toast.error(
          (e as Error).message || 'Failed to update training component time'
        )
    );
  }

  return (
    <Box>
      {/* Training components */}
      <Box
        sx={{
          flex: 1,
          mt: screenSize.isMobile || screenSize.isSmallTablet ? 0.5 : undefined,
          display: 'flex',
          flexDirection: 'column',
          alignItems:
            screenSize.isMobile || screenSize.isSmallTablet
              ? 'center'
              : undefined,
        }}
      >
        {isTrainingComponent ? (
          <TrainerWeekViewItem
            key={item.id}
            item={item}
            setSelectedItem={setSelectedItem}
            setOpenModal={setOpenModal}
          />
        ) : (
          <TrainerWeekViewItem
            key={item.id}
            item={item as GroupEvent}
            setSelectedItem={setSelectedItem}
            setOpenModal={setOpenModal}
          />
        )}
      </Box>

      <MyModal
        isOpen={openModal}
        setIsOpen={(open) => setOpenModal(open)}
        onCancel={() => setOpenModal(false)}
        cancelText="Close"
        confirmText=""
        onDelete={
          !selectedItem || checkIsTrainingComponent(selectedItem)
            ? undefined
            : () => {
                if (!selectedItem) return;
                setGroup((prev) => ({
                  ...prev,
                  events: prev.events?.filter(
                    (ev) => ev.id !== selectedItem.id
                  ),
                }));

                setSelectedItem(null);
              }
        }
        sx={{
          p: 0,
        }}
        dialogueContentSx={{
          p: 0,
        }}
      >
        {selectedItem && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={2}
            p={screenSize.isMobile || screenSize.isSmallTablet ? 2 : undefined}
          >
            {checkIsTrainingComponent(selectedItem) ? (
              <Typography fontSize={20}>
                {selectedItem.target
                  ? selectedItem.component?.name +
                    ' ' +
                    selectedItem.target?.name
                  : selectedItem.component?.name}
              </Typography>
            ) : (
              <TextField
                variant="standard"
                value={selectedItem.title}
                onChange={(e) => {
                  const newItem = { ...selectedItem, title: e.target.value };
                  setSelectedItem((prev) => (prev ? newItem : null));
                  setGroup((prev) => ({
                    ...prev,
                    events: prev.events?.map((ev) =>
                      ev.id === selectedItem.id ? newItem : ev
                    ),
                  }));
                }}
                sx={{
                  textAlign: 'center',
                  width: '100%',
                  p: 0,
                  m: 0,
                  '& .MuiInput-underline:before': {
                    color: 'transparent !important',
                    border: 'none !important',
                  },
                  '& .MuiInput-underline:after': {
                    border: 'none',
                  },
                  '& .MuiInput-underline:hover:before': {
                    border: 'none',
                  },
                  ':hover': {
                    border: 'none',
                  },
                }}
                inputProps={{
                  style: {
                    backgroundColor: theme.palette.background.dark,
                    padding: 1,
                    borderRadius: 6,
                    border: 'none',
                    textAlign: 'center',
                    fontSize: 20,
                    paddingTop: 0,
                    paddingBottom: 0,
                  },
                }}
              />
            )}

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box display="flex" justifyContent="space-evenly" gap={1}>
                <TimePicker
                  label="Start"
                  value={dayjs(selectedItem?.from)}
                  onChange={async (newValue) => {
                    if (!newValue) return;
                    await handleUpdateTrainingTimes({
                      ...selectedItem,
                      from: newValue.toDate(),
                    });
                  }}
                  sx={{
                    width:
                      screenSize.isMobile || screenSize.isSmallTablet
                        ? 120
                        : 150,
                  }}
                />

                <TimePicker
                  label="End"
                  value={dayjs(selectedItem?.to)}
                  onChange={async (newValue) => {
                    if (!newValue) return;
                    await handleUpdateTrainingTimes({
                      ...selectedItem,
                      to: newValue.toDate(),
                    });
                  }}
                  sx={{
                    width:
                      screenSize.isMobile || screenSize.isSmallTablet
                        ? 120
                        : 150,
                  }}
                />
              </Box>
            </LocalizationProvider>

            <TextField
              variant="standard"
              label="Location"
              value={selectedItem.location}
              onChange={(e) => {
                const newItem = {
                  ...selectedItem,
                  location: e.target.value,
                };

                setSelectedItem((prev) => (prev ? newItem : null));

                if (checkIsTrainingComponent(newItem)) {
                  setTrainings((prev) =>
                    prev.map((t) =>
                      t.id === newItem.trainingId
                        ? {
                            ...t,
                            components: t.components.map((c) =>
                              c.id === newItem.id
                                ? { ...c, location: newItem.location }
                                : c
                            ),
                          }
                        : t
                    )
                  );
                } else {
                  setGroup((prev) => ({
                    ...prev,
                    events: prev.events?.map((ev) =>
                      ev.id === newItem.id ? newItem : ev
                    ),
                  }));
                }
              }}
              sx={{
                width: '66%',
              }}
            />
          </Box>
        )}
      </MyModal>
    </Box>
  );
}
