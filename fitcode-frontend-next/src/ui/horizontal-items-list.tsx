import { Add, ArrowLeft, ArrowRight, Circle } from '@mui/icons-material';
import type { SxProps } from '@mui/material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import type { RefObject } from 'react';
import { Fragment, useEffect, useLayoutEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import type { Training } from '@/core/training/type/training.type';
import type { User } from '@/core/user/type/user.type';
import type { Day } from '@/lib/common/service/date.util';
import { useDashboard } from '@/store/dashboard.provider';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';

interface Props {
  items: { label: string; value: string; sublabel?: string }[];
  value: string;
  setValue: (value: string) => void;
  checkIsSameValue: (value: string) => boolean;
  onArrowClick?: (direction: 'left' | 'right') => void;
  sx?: SxProps;
  noItemsText?: string;
  dayView?: boolean;
  weekView?: boolean;
  cycleView?: boolean;
  yearView?: boolean;
  alertOnChange?: boolean;
  dashboardView?: boolean;
  dashboardInstitutionsView?: boolean;
  addButtonOnEnd?: boolean;
  onButtonClick?: () => void;
  scrollHorizontalListLeftRef?: RefObject<number>;
  selectedAthlete?: User;
  trainings?: Training[];
  day?: Day;
}

export default function HorizontalItemsList(props: Props) {
  const SCROLL_STEP = 150; // Adjust this value as needed
  const theme = useTheme();
  const screenSize = useScreenSize();

  const {
    items,
    setValue,
    onArrowClick,
    sx,
    noItemsText,
    dayView,
    weekView,
    cycleView,
    yearView,
    checkIsSameValue,
    alertOnChange,
    dashboardView,
    dashboardInstitutionsView,
    addButtonOnEnd,
    onButtonClick,
    scrollHorizontalListLeftRef,
    selectedAthlete,
    trainings,
    day,
  } = props;

  const dashboard = useDashboard() ?? {};
  const group = useGroup() ?? {};

  const { cycle } = group;

  const source = dashboardView || dashboardInstitutionsView ? dashboard : group;

  const { detectedChanges, setDetectedChanges } = source;

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    scrollContainerRef.current.scrollLeft =
      scrollHorizontalListLeftRef?.current || 0;
  }, [scrollContainerRef.current]);

  const getShortGroupName = (name: string) => {
    const finalName = name.length >= 2 ? name.slice(0, 3) : name;

    return finalName.toUpperCase().trim();
  };

  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !scrollHorizontalListLeftRef) return;

    el.scrollLeft = scrollHorizontalListLeftRef.current;
  }, [props.value]);

  const isTrainingInPeriod = (
    period: 'AM' | 'PM',
    item: { label: string; value: string; sublabel?: string }
  ) => {
    return (
      dayView &&
      trainings &&
      day &&
      !dayjs(day.date).isSame(item.value, 'day') &&
      trainings.some(
        (t) =>
          dayjs(new Date(item.value)).isSame(t.from, 'day') &&
          (period === 'AM' ? dayjs(t.to).hour() < 12 : dayjs(t.to).hour() >= 12)
      )
    );
  };

  const TrainingDot = ({ i, top }: { i: number; top: boolean }) => {
    return (
      <Circle
        sx={{
          position: 'absolute',
          left: i === items.length - 1 ? '70%' : i === 0 ? '35%' : '50%',
          top: top ? 0 : undefined,
          bottom: !top ? 0 : undefined,
          transform: 'translateX(-50%)',
          color: theme.palette.text.primary,
          fontSize: 6,
        }}
      />
    );
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      marginX="auto"
      sx={{
        py: cycleView && !cycle ? 2.3 : 1,
        backgroundColor: theme.palette.background.default,
        width: screenSize.isMobile
          ? '100%'
          : screenSize.isTablet
            ? cycleView
              ? '50% !important'
              : '100% !important'
            : screenSize.isSmallLaptop && dayView
              ? '100% !important'
              : '66% !important',
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        ...sx,
      }}
    >
      {/* Left Arrow */}
      <IconButton
        sx={{ p: 0, m: 0, display: selectedAthlete ? 'none' : undefined }}
        onClick={() => {
          if (cycleView || dashboardView) {
            scrollContainerRef.current?.scrollBy({
              left: -SCROLL_STEP, // adjust scroll distance as needed
              behavior: 'smooth',
            });
            if (scrollHorizontalListLeftRef)
              scrollHorizontalListLeftRef.current =
                scrollContainerRef.current?.scrollLeft || 0;
            return;
          }

          if (props.alertOnChange && detectedChanges) {
            toast.error('Unsaved changes will be lost', {
              icon: '⚠️',
              duration: 2000,
            });

            setDetectedChanges(false);
            return;
          }
          onArrowClick?.('left');
        }}
      >
        <ArrowLeft sx={{ fontSize: 30 }} />
      </IconButton>

      {/* Scrollable Days */}
      <Box
        ref={scrollContainerRef}
        width={addButtonOnEnd ? '90%' : '100%'}
        gap={dayView ? 0 : 1}
        sx={{
          display: 'flex',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          mx: dayView ? 0 : 1,
          justifyContent: selectedAthlete
            ? 'center'
            : items.length <= 3
              ? 'space-around'
              : 'space-between',
          flexGrow: screenSize.isMobile ? 1 : undefined,
          gap: selectedAthlete ? 2 : undefined,
        }}
      >
        {items.length === 0 ? (
          <Typography>{noItemsText}</Typography>
        ) : (
          items.map((item, i) => {
            const isSameValue = checkIsSameValue(item.value);
            const isSameDay = dayjs(item.value).isSame(
              dayjs(new Date()),
              'day'
            );

            if (selectedAthlete) {
              return (
                <Box
                  key={`${i}-${item.value}`}
                  width={50}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={0.1}
                  sx={{
                    backgroundColor: theme.palette.background.default,
                    border: `1px solid ${theme.palette.primary.main}`,
                    borderRadius: 1.5,
                    p: 0.5,
                    py: 0.25,
                    my: 0.2,
                  }}
                >
                  <Typography color={theme.palette.primary.main} fontSize={14}>
                    {item.value}
                  </Typography>
                  <Box
                    width="50%"
                    height={4}
                    sx={{
                      backgroundColor: item.sublabel,
                      borderRadius: 5,
                    }}
                  />
                  <Typography color={theme.palette.primary.main} fontSize={10}>
                    {item.label}
                  </Typography>
                </Box>
              );
            }

            return (
              <Box
                key={i}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                sx={{
                  px: dashboardView || isSameValue ? 0 : 2,
                  pl: i === 0 ? 0 : undefined,
                  pr: i === items.length - 1 ? 0 : undefined,
                  cursor: 'pointer',
                  flex: '0 0 auto', // important so it doesn't shrink
                  position: 'relative',
                  backgroundColor: isSameValue
                    ? theme.palette.primary.main
                    : undefined,
                  borderRadius: isSameValue ? '25%' : 0,
                }}
                onClick={() => {
                  if (alertOnChange && detectedChanges) {
                    toast.error('Unsaved changes will be lost', {
                      icon: '⚠️',
                      duration: 2000,
                    });

                    setDetectedChanges(false);
                    return;
                  }

                  if (scrollHorizontalListLeftRef)
                    scrollHorizontalListLeftRef.current =
                      scrollContainerRef.current?.scrollLeft ?? 0;

                  setValue(item.value);
                }}
              >
                {isTrainingInPeriod('AM', item) && (
                  <TrainingDot i={i} top={true} />
                )}
                {dayView ||
                weekView ||
                yearView ||
                dashboardView ||
                dashboardInstitutionsView ? (
                  <Box
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    sx={{
                      minWidth: isSameValue ? '42px' : undefined,
                      py:
                        dashboardView || dashboardInstitutionsView
                          ? 1.5
                          : isSameValue
                            ? 0.75
                            : 0,
                    }}
                  >
                    <Tooltip title={dashboardView ? item.label : ''}>
                      <Typography
                        key={`${item.value}-${i}-label`}
                        fontSize={isSameValue ? 16 : 12}
                        textAlign="center"
                        sx={{
                          fontWeight: isSameValue ? 800 : 250,
                          m: 0,
                          color: isSameValue
                            ? theme.palette.text.secondary
                            : undefined,
                          px: dashboardInstitutionsView ? 0.5 : undefined,
                        }}
                      >
                        {(dayView && isSameValue && isSameDay) ||
                        (weekView && isSameValue) ||
                        (yearView && isSameValue)
                          ? item.sublabel
                          : dashboardView
                            ? item.label.substring(0, 3).toUpperCase()
                            : dashboardInstitutionsView
                              ? item.label[0].toUpperCase() +
                                item.label.slice(1).toLowerCase()
                              : item.label}
                      </Typography>
                    </Tooltip>
                    <Typography
                      key={`${item.value}-${i}-sublabel`}
                      fontSize={isSameValue ? 12 : 14}
                      textAlign="center"
                      sx={{
                        fontWeight: isSameValue ? 800 : 250,
                        m: 0,
                        color: isSameValue
                          ? theme.palette.text.secondary
                          : undefined,
                      }}
                    >
                      {isSameValue && isSameDay
                        ? 'Today'
                        : (weekView && isSameValue) || (yearView && isSameValue)
                          ? item.label
                          : item.sublabel || ''}
                    </Typography>
                  </Box>
                ) : (
                  <Typography
                    key={`${item.value}-${i}`}
                    textAlign="center"
                    sx={{
                      zIndex: isSameValue ? 10 : 9,
                      fontSize: isSameValue ? '13px' : '12px',
                      fontWeight:
                        dashboardView ||
                        dashboardInstitutionsView ||
                        isSameValue
                          ? 800
                          : 250,
                      m: 0,
                      minWidth:
                        isSameValue && (weekView || cycleView)
                          ? '42px'
                          : isSameValue ||
                              dashboardView ||
                              dashboardInstitutionsView
                            ? '50px'
                            : undefined,
                      border:
                        (dashboardView || dashboardInstitutionsView) &&
                        isSameValue
                          ? `1px solid ${theme.palette.primary.main}`
                          : undefined,
                      borderRadius:
                        dashboardView || dashboardInstitutionsView ? 1.5 : 0,
                      maxWidth: cycleView ? '70px' : undefined,
                      overflow: cycleView ? 'hidden' : undefined,
                      textOverflow: cycleView ? 'ellipsis' : undefined,
                      whiteSpace: cycleView ? 'nowrap' : undefined,
                      color:
                        isSameValue &&
                        !dashboardView &&
                        !dashboardInstitutionsView
                          ? theme.palette.text.secondary
                          : undefined,
                      py:
                        dashboardView || dashboardInstitutionsView
                          ? 1.5
                          : isSameValue
                            ? 0.75
                            : undefined,
                      px: dashboardInstitutionsView ? 1.5 : undefined,
                      backgroundColor:
                        dashboardView || dashboardInstitutionsView
                          ? theme.palette.background.light
                          : undefined,
                    }}
                  >
                    {cycleView ? (
                      (weekView && isSameValue
                        ? item.label.split(' ').reverse()
                        : item.label.split(' ')
                      ).map((word, index) => (
                        <Fragment key={`${word}-${index}`}>
                          {index < 2
                            ? word +
                              (index === 1 && item.label.split(' ').length > 2
                                ? '...'
                                : '')
                            : undefined}
                          {index < 2 &&
                            index < item.label.split(' ').length - 1 && <br />}
                        </Fragment>
                      ))
                    ) : dashboardView ? (
                      getShortGroupName(item.label)
                    ) : dashboardInstitutionsView ? (
                      item.label.toUpperCase()
                    ) : isSameValue ? (
                      <>
                        {item.sublabel || ''}
                        <br />
                        {isSameDay ? 'Today' : item.label}
                      </>
                    ) : (
                      <>
                        {item.label}
                        <br />
                        {isSameDay ? 'Today' : item.sublabel || ''}
                      </>
                    )}
                  </Typography>
                )}

                {isTrainingInPeriod('PM', item) && (
                  <TrainingDot i={i} top={false} />
                )}
              </Box>
            );
          })
        )}
      </Box>

      {addButtonOnEnd && (
        <Box
          width="10%"
          display="flex"
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '50px',
          }}
        >
          <IconButton
            sx={{
              p: 0.8,
              m: 0,
              backgroundColor: theme.palette.background.light,
              borderRadius: 1,
            }}
            onClick={() => {
              onButtonClick?.();
            }}
          >
            <Add fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Right Arrow */}
      <IconButton
        sx={{ p: 0, m: 0, display: selectedAthlete ? 'none' : undefined }}
        onClick={() => {
          if (cycleView || dashboardView) {
            scrollContainerRef.current?.scrollBy({
              left: SCROLL_STEP, // adjust scroll distance as needed
              behavior: 'smooth',
            });
            return;
          }
          if (props.alertOnChange && detectedChanges) {
            toast.error('Unsaved changes will be lost', {
              icon: '⚠️',
              duration: 2000,
            });

            setDetectedChanges(false);
            return;
          }
          onArrowClick?.('right');
        }}
      >
        <ArrowRight sx={{ fontSize: 30 }} />
      </IconButton>
    </Box>
  );
}
