'use client';

import { Box, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import MyModal from '../modal/modal';
import TrainerWeekViewItem from '../training-week-component-item/training-week-component-item';
import { isOverlaping } from './state';
import type { GroupEvent } from '@/controller/group/type/group-event.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';

export type WeekViewItemProps = {
  item: Training | GroupEvent;
};

export default function WeekViewItem(props: WeekViewItemProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { item } = props;
  const { group, setGroup, trainings, setTrainings } = useGroup();

  const checkIsTraining = (item: Training | GroupEvent): item is Training => {
    return (item as Training).components !== undefined;
  };
  const checkIsTrainingComponent = (
    item: TrainingComponent | GroupEvent
  ): item is TrainingComponent => {
    return (item as TrainingComponent).supersets !== undefined;
  };

  const isTraining = checkIsTraining(item);

  const [updatedComponents] = useState<TrainingComponent[] | undefined>(
    isTraining ? item.components : undefined
  );
  const [selectedItem, setSelectedItem] = useState<
    (TrainingComponent | GroupEvent) | null
  >(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (!isTraining || !updatedComponents) return;

    // only update current filtered trainings (in week view, max 7 of them are in array)
    // and update all trainings and current training after training is saved
    setTrainings((prev) =>
      prev.map((t) =>
        t.id === item.id ? { ...item, components: updatedComponents } : t
      )
    );
  }, [updatedComponents]);

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
        {isTraining && item.components ? (
          item.components.map((c) => (
            <TrainerWeekViewItem
              key={c.id}
              item={c}
              setSelectedItem={setSelectedItem}
              setOpenModal={setOpenModal}
            />
          ))
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
                  onChange={(newValue) => {
                    if (!newValue) return;

                    const newItem = {
                      ...selectedItem,
                      from: newValue.toDate(),
                    };

                    if (dayjs(newItem.from).isAfter(dayjs(newItem.to)))
                      newItem.to = dayjs(newItem.from)
                        .add(5, 'minutes')
                        .toDate();

                    if (isOverlaping(newItem, { trainings, group })) {
                      toast.error(
                        'Time overlaps with another event or component'
                      );
                      return;
                    }

                    setSelectedItem((prev) => (prev ? newItem : null));

                    if (checkIsTrainingComponent(newItem)) {
                      setTrainings((prev) =>
                        prev.map((t) =>
                          t.id === item.id
                            ? {
                                ...t,
                                components: t.components.map((c) =>
                                  c.id === newItem.id ? newItem : c
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
                    width:
                      screenSize.isMobile || screenSize.isSmallTablet
                        ? 120
                        : 150,
                  }}
                />
                <TimePicker
                  label="End"
                  value={dayjs(selectedItem?.to)}
                  onChange={(newValue) => {
                    if (!newValue) return;

                    const newItem = {
                      ...selectedItem,
                      to: newValue.toDate(),
                    };

                    if (dayjs(newItem.from).isAfter(dayjs(newItem.to)))
                      newItem.from = dayjs(newItem.to)
                        .subtract(5, 'minutes')
                        .toDate();

                    if (isOverlaping(newItem, { trainings, group })) {
                      toast.error(
                        'Time overlaps with another event or component'
                      );
                      return;
                    }

                    setSelectedItem((prev) => (prev ? newItem : null));

                    if (checkIsTrainingComponent(newItem)) {
                      setTrainings((prev) =>
                        prev.map((t) =>
                          t.id === item.id
                            ? {
                                ...t,
                                components: t.components.map((c) =>
                                  c.id === newItem.id ? newItem : c
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
                      t.id === item.id
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
