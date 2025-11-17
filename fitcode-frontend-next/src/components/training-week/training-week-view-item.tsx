'use client';

import { Box, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useState } from 'react';

import { handleUpdateTrainingTimes } from './actions/actions-week-item';
import TrainerWeekViewItem from './training-week-component-item';
import { core } from '@/core/core.service';
import type { GroupEvent } from '@/core/group/type/group-event.type';
import type { TrainingComponentWithTrainingId } from '@/core/training/type/training-component.type';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import MyModal from '@/ui/modal';

export type WeekViewItemProps = {
  item: TrainingComponentWithTrainingId | GroupEvent;
};

export default function WeekViewItem({ item }: WeekViewItemProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const groupContext = useGroup();
  const { setGroup, setTrainings } = groupContext;

  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    (TrainingComponentWithTrainingId | GroupEvent) | null
  >(null);

  const checkIsTrainingComponent = (
    item: TrainingComponentWithTrainingId | GroupEvent
  ): item is TrainingComponentWithTrainingId => {
    return (item as TrainingComponentWithTrainingId).supersets !== undefined;
  };

  const isTrainingComponent = checkIsTrainingComponent(item);
  const component = isTrainingComponent
    ? core.training.component.find(item.id)
    : null;

  const target = isTrainingComponent
    ? core.training.component.findTarget(item.targetId)
    : null;

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
                {target
                  ? component?.name + ' ' + target?.name
                  : component?.name}
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
                    await handleUpdateTrainingTimes(
                      {
                        item,
                        newItem: { ...selectedItem, from: newValue.toDate() },
                        selectedItem,
                        setSelectedItem,
                        checkIsTrainingComponent,
                      },
                      groupContext
                    );
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
                    await handleUpdateTrainingTimes(
                      {
                        item,
                        newItem: {
                          ...selectedItem,
                          to: newValue.toDate(),
                        },
                        selectedItem,
                        setSelectedItem,
                        checkIsTrainingComponent,
                      },
                      groupContext
                    );
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
