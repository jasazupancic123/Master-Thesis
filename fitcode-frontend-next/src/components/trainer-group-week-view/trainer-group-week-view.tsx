'use client';

import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import React, { Fragment, useEffect, useState } from 'react';

import CustomDivider from '../custom-divider/custom-divider';
import GroupCycleInfo from '../group-cycle-info/group-cycle-info';
import HorizontalItemsList from '../horizontal-items-list/horizontal-items-list';
import { DIVIDER_HEIGHT, MAX_WIDTH } from '../trainer-day-view/constant';
import VerticalLinesBorders from '../vertical-lines-borders/vertical-lines-borders';
import { CommonService } from '@/common/service/common.service';
import TrainingItem from '@/components/training-week-view-item/training-week-view-item';
import type { Week } from '@/controller/group/type/cycle.type';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';

const commonService = CommonService.instance;

export default function TrainerWeekView() {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { group, cycle, trainings, setDateFrom, setDateTo } = useGroup();

  const [index, setIndex] = useState(0); // week index
  const [amTrainingsHeight, setAmTrainingsHeight] = useState(200);
  const [pmTrainingsHeight, setPmTrainingsHeight] = useState(200);

  const weeks = cycle
    ? commonService.date.weeks(cycle.from, cycle.to)
    : commonService.date.weeks(new Date(), dayjs().add(6, 'day').toDate());

  const [week, setWeek] = useState(1);

  useEffect(() => {
    if (!cycle?.from) return;

    const cycleStart = dayjs(cycle.from).startOf('day');
    const cycleWeek = cycleStart.week();
    const currentWeek = dayjs(weeks[index][0].date)?.subtract(1, 'day').week();
    const diff = currentWeek - cycleWeek + 1;

    setWeek(diff);
  }, [index]);

  useEffect(() => {
    if (!cycle) return;
    setIndex(0);
  }, [cycle]);

  useEffect(() => {
    if (weeks.length < 7) return;

    setDateFrom(dayjs(weeks[index][0].date));
    setDateTo(dayjs(weeks[index][6].date));
  }, [cycle, index]);

  useEffect(() => {
    const amTrainingsElements = document.querySelectorAll('[id^="AM-"]');
    const pmTrainingsElements = document.querySelectorAll('[id^="PM-"]');

    // find the one with the biggest height
    const amHeight = Array.from(amTrainingsElements).reduce((acc, curr) => {
      return Math.max(acc, (curr as HTMLElement).offsetHeight);
    }, 0);

    const pmHeight = Array.from(pmTrainingsElements).reduce((acc, curr) => {
      return Math.max(acc, (curr as HTMLElement).offsetHeight);
    }, 0);

    setAmTrainingsHeight(amHeight);
    setPmTrainingsHeight(pmHeight);
  }, [weeks, index, trainings]);

  return (
    <Box
      width="100%"
      maxWidth={MAX_WIDTH}
      display="flex"
      flexDirection="column"
      sx={{
        mx: 'auto',
        position: 'relative',
        minHeight: 'calc(100vh - 50px)',
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
      >
        <Box
          width="100%"
          display="flex"
          flexDirection={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
          pb={screenSize.isSmallerThanLaptop ? 2 : undefined}
        >
          <Box width="25%" display="flex" />

          <Box
            width={screenSize.isSmallerThanLaptop ? '100%' : '50%'}
            display="flex"
          >
            <HorizontalItemsList
              items={weeks.map((week: Week[], i: number) => {
                return { label: `WEEK ${i + 1}`, value: i.toString() };
              })}
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
          >
            <GroupCycleInfo
              group={group}
              cycle={cycle}
              week={week}
              smallDisplay={screenSize.isSmallerThanLaptop}
              disableMoreVert={screenSize.isSmallerThanLaptop}
            />
          </Box>
        </Box>

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
          }}
        >
          {weeks[index]?.map(({ date }, i) => {
            const day = dayjs(date);
            return (
              <Box key={i} width={`${100 / 7}%`}>
                <Typography textAlign="center" fontSize={14}>
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
        {!screenSize.isSmallerThanLaptop && <CustomDivider />}

        {/* Trainings */}
        <Box width="100%" display="flex" justifyContent="center">
          {weeks[index]?.map(({ date }, i) => {
            const day = dayjs(date);
            const filtered = trainings.filter((t) =>
              commonService.date.isBetween(day, dayjs(t.from), dayjs(t.to))
            );

            const amTraining = filtered.find((t) => dayjs(t.from).hour() < 12);
            const pmTraining = filtered.find((t) => dayjs(t.from).hour() >= 12);

            const minHeight = screenSize.isSmallerThanLaptop ? 100 : 200;

            return (
              <Box
                key={i}
                width={`${100 / 7}%`}
                minHeight={200}
                alignSelf="stretch"
                display="flex"
                flexDirection="column"
              >
                {/* AM training */}
                <Box
                  id={`AM-${i}`}
                  height={
                    amTrainingsHeight > minHeight
                      ? amTrainingsHeight
                      : undefined
                  }
                  minHeight={minHeight}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: `0.5px solid ${theme.palette.background.dark}`,
                    borderLeft:
                      i === 0 && !screenSize.isSmallerThanLaptop
                        ? 'none'
                        : undefined,
                    borderRight:
                      i === 6 && !screenSize.isSmallerThanLaptop
                        ? 'none'
                        : undefined,
                    borderTop: 'none',
                  }}
                >
                  {amTraining && (
                    <Fragment key={amTraining.id}>
                      <TrainingItem training={amTraining} />
                    </Fragment>
                  )}
                </Box>

                {/* PM training */}
                <Box
                  id={`PM-${i}`}
                  height={
                    pmTrainingsHeight > minHeight
                      ? pmTrainingsHeight
                      : undefined
                  }
                  minHeight={minHeight}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: `0.5px solid ${theme.palette.background.dark}`,
                    borderLeft:
                      i === 0 && !screenSize.isSmallerThanLaptop
                        ? 'none'
                        : undefined,
                    borderRight:
                      i === 6 && !screenSize.isSmallerThanLaptop
                        ? 'none'
                        : undefined,
                    borderBottom: 'none',
                  }}
                >
                  {pmTraining && (
                    <Fragment key={pmTraining.id}>
                      <TrainingItem training={pmTraining} />
                    </Fragment>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        {!screenSize.isSmallerThanLaptop && <CustomDivider />}
      </Box>
    </Box>
  );
}
