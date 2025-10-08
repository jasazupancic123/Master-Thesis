'use client';

import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  useTheme,
} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import React, { Fragment, useEffect, useRef, useState } from 'react';

import CustomDivider from '../custom-divider/custom-divider';
import HorizontalItemsList from '../horizontal-items-list/horizontal-items-list';
import { DIVIDER_HEIGHT, MAX_WIDTH } from '../trainer-day-view/constant';
import VerticalLinesBorders from '../vertical-lines-borders/vertical-lines-borders';
import DraggableSelect from './draggable-select';
import DroppableSlot from './droppable-slot';
import { customScrollBarStyle, getAmPmItems, onDragEndAddEvent } from './state';
import { CommonService } from '@/common/service/common.service';
import WeekViewItem from '@/components/training-week/training-week-view-item';
import { EventType } from '@/controller/group/enum/event-type.enum';
import type { Week } from '@/controller/group/type/cycle.type';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';

const commonService = CommonService.instance;

export default function TrainerWeekView() {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { group, setGroup, cycle, trainings, setDateFrom, setDateTo } =
    useGroup();

  const [index, setIndex] = useState(0); // week index

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null
  );

  const weeks = cycle
    ? commonService.date.weeks(cycle.from, cycle.to)
    : commonService.date.weeks(new Date(), dayjs().add(6, 'day').toDate());

  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cycle) return;
    setIndex(0);
  }, [cycle]);

  useEffect(() => {
    if (weeks.length < 7) return;

    setDateFrom(dayjs(weeks[index][0].date));
    setDateTo(dayjs(weeks[index][6].date));
  }, [cycle, index]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 0, tolerance: 5 },
    })
  );

  const disabledSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 999999 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 999999, tolerance: 999999 },
    })
  );

  return (
    <DndContext
      sensors={selectedEventType ? sensors : disabledSensors}
      collisionDetection={closestCenter}
      onDragStart={() => {
        setMenuOpen(false);
      }}
      onDragEnd={(e) =>
        selectedEventType
          ? onDragEndAddEvent(e, {
              selectedEventType,
              setSelectedEventType,
              setGroup,
              weeks,
              index,
              selectRef,
              trainings,
              commonService,
              group,
            })
          : undefined
      }
    >
      <Box
        width="100%"
        maxWidth={MAX_WIDTH}
        display="flex"
        flexDirection="column"
        sx={{
          mx: 'auto',
          position: 'relative',
          minHeight: 'calc(100vh - 50px)',
          px: 3,
        }}
      >
        <VerticalLinesBorders />
        {/* Week selector */}
        <Box
          width="100%"
          height={!screenSize.isSmallerThanLaptop ? DIVIDER_HEIGHT : undefined}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="space-between"
          gap={screenSize.isSmallerThanLaptop ? 2 : undefined}
          sx={{
            pb: 3.5,
          }}
        >
          <Box
            width="100%"
            display="flex"
            flexDirection={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
          >
            <Box width="25%" display="flex" />

            <Box
              width={screenSize.isSmallerThanLaptop ? '100%' : '50%'}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="space-between"
            >
              <HorizontalItemsList
                items={weeks.map((week: Week[], i: number) => {
                  return {
                    label: `Week`,
                    sublabel: `${i + 1}`,
                    value: i.toString(),
                  };
                })}
                weekView
                noItemsText="No weeks available"
                value={index.toString()}
                setValue={(value) => {
                  setIndex(parseInt(value, 10));
                }}
                onArrowClick={() => {}}
                cycleView
                checkIsSameValue={(value: string) => {
                  return value === index.toString();
                }}
              />
            </Box>
            <Box
              width={screenSize.isSmallerThanLaptop ? '50%' : '25%'}
              display="flex"
              justifyContent={
                screenSize.isSmallerThanLaptop ? 'center' : 'flex-end'
              }
              sx={{
                mx: screenSize.isSmallerThanLaptop ? 'auto' : undefined,
              }}
            ></Box>
          </Box>

          <FormControl size="small" sx={{ p: 0, m: 0 }}>
            {!selectedEventType && (
              <InputLabel id="event-type-label">Event type</InputLabel>
            )}
            <DraggableSelect selectedEventType={selectedEventType}>
              <Select
                ref={selectRef}
                value={selectedEventType || ''}
                open={menuOpen}
                onOpen={() => setMenuOpen(true)}
                onClose={() => setMenuOpen(false)}
                onChange={(e) => {
                  setSelectedEventType(e.target.value as EventType);
                  setMenuOpen(false);
                }}
                sx={{
                  minWidth: !selectedEventType ? 150 : undefined,
                  borderRadius: selectedEventType ? 2 : undefined,
                  backgroundColor: selectedEventType
                    ? theme.palette.background.light
                    : undefined,
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '& .MuiSelect-select': {
                    cursor: selectedEventType ? 'grab' : undefined,
                    backgroundColor: selectedEventType
                      ? theme.palette.primary.main
                      : undefined,
                    color: selectedEventType
                      ? theme.palette.text.secondary
                      : undefined,
                    fontWeight: selectedEventType ? 'bold' : undefined,
                  },
                  // icon
                  '& .MuiSelect-icon': {
                    color: selectedEventType
                      ? theme.palette.text.secondary
                      : undefined,
                  },
                }}
              >
                {Object.values(EventType).map((eventType) => (
                  <MenuItem key={eventType} value={eventType}>
                    {eventType[0].toUpperCase() + eventType.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </DraggableSelect>
          </FormControl>
        </Box>

        {!screenSize.isSmallerThanLaptop && <CustomDivider />}

        {/* Dates */}
        <Box
          width={screenSize.isSmallerThanLaptop ? '95%' : '100%'}
          display="flex"
          justifyContent="center"
          sx={{
            border: screenSize.isSmallerThanLaptop
              ? `1px solid ${theme.palette.text.primary}`
              : undefined,
            borderBottom: 'none',
            py: 2,
            mx: 'auto',
          }}
        >
          {weeks[index]?.map(({ date }, i) => {
            const day = dayjs(date);
            return (
              <Box key={i} width={`${100 / 7}%`}>
                <Typography textAlign="center" fontSize={16}>
                  {commonService.date.format(
                    day,
                    {},
                    screenSize.isSmallerThanLaptop ? 'D/M' : 'dddd - D/M'
                  )}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box
          width={screenSize.isSmallerThanLaptop ? '95%' : '100%'}
          sx={{
            border: screenSize.isSmallerThanLaptop
              ? `1px solid ${theme.palette.text.primary}`
              : undefined,
            mx: 'auto',
          }}
        >
          {/* Trainings */}
          <Box width="100%" display="flex" justifyContent="center">
            {weeks[index]?.map(({ date }, i) => {
              const { amItems, pmItems } = getAmPmItems(date, {
                trainings,
                commonService,
                group,
              });

              return (
                <Box
                  key={i}
                  width={`${100 / 7}%`}
                  minHeight={200}
                  alignSelf="stretch"
                  display="flex"
                  flexDirection="column"
                >
                  <DroppableSlot id={`AM-${i}`} dayIndex={i} period="AM">
                    {/* AM training */}
                    <Box
                      id={`AM-${i}`}
                      height={`calc((100vh - ${DIVIDER_HEIGHT}) / 2.4)`}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        ...customScrollBarStyle(theme),
                      }}
                    >
                      {amItems.map((item) => (
                        <Fragment key={item.id}>
                          <WeekViewItem item={item} />
                        </Fragment>
                      ))}
                    </Box>
                  </DroppableSlot>

                  {/* PM training */}
                  <DroppableSlot id={`PM-${i}`} dayIndex={i} period="PM">
                    <Box
                      id={`PM-${i}`}
                      height={`calc((100vh - ${DIVIDER_HEIGHT}) / 2.4)`}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        border: `0.5px solid ${theme.palette.background.dark}`,
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderBottom: 'none',
                        overflowY: 'auto',
                        ...customScrollBarStyle(theme),
                      }}
                    >
                      {pmItems.map((item) => (
                        <Fragment key={item.id}>
                          <WeekViewItem item={item} />
                        </Fragment>
                      ))}
                    </Box>
                  </DroppableSlot>
                </Box>
              );
            })}
          </Box>

          {!screenSize.isSmallerThanLaptop && <CustomDivider />}
        </Box>
      </Box>
    </DndContext>
  );
}
