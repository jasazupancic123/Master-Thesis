import { Add, ArrowLeft, ArrowRight } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import type { RefObject } from 'react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import { useDashboard } from '@/store/dashboard-provider';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';

interface HorizontalItemsListProps {
  items: { label: string; value: string; sublabel?: string }[];
  value: string;
  setValue: (value: string) => void;
  checkIsSameValue: (value: string) => boolean;
  onArrowClick?: (direction: 'left' | 'right') => void;
  dayView?: boolean;
  cycleView?: boolean;
  yearView?: boolean;
  alertOnChange?: boolean;
  dashboardView?: boolean;
  dashboardInstitutionsView?: boolean;
  addButtonOnEnd?: boolean;
  onButtonClick?: () => void;
  scrollHorizontalListLeftRef?: RefObject<number>;
}

export default function HorizontalItemsList(props: HorizontalItemsListProps) {
  const SCROLL_STEP = 150; // Adjust this value as needed
  const theme = useTheme();
  const screenSize = useScreenSize();

  const {
    items,
    setValue,
    onArrowClick,
    dayView,
    cycleView,
    yearView,
    checkIsSameValue,
    alertOnChange,
    dashboardView,
    dashboardInstitutionsView,
    addButtonOnEnd,
    onButtonClick,
    scrollHorizontalListLeftRef,
  } = props;

  const { detectedChanges, setDetectedChanges } =
    dashboardView || dashboardInstitutionsView ? useDashboard() : useGroup();

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

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      marginX="auto"
      sx={{
        py: yearView ? 2.3 : 1,
        backgroundColor: theme.palette.background.dark,
        ml: cycleView ? 'auto' : undefined,
        width: screenSize.isMobile
          ? '100%'
          : screenSize.isTablet
            ? cycleView
              ? '50% !important'
              : '100% !important'
            : '66% !important',
      }}
    >
      {/* Left Arrow */}
      <IconButton
        sx={{ p: 0, m: 0 }}
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
        <ArrowLeft
          sx={{ fontSize: 30, color: theme.palette.background.light }}
        />
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
          justifyContent: items.length <= 3 ? 'space-around' : 'space-between',
          flexGrow: screenSize.isMobile ? 1 : undefined,
        }}
      >
        {items.map((item, i) => {
          const isSameValue = checkIsSameValue(item.value);
          const isSameDay = dayjs(item.value).isSame(dayjs(new Date()), 'day');

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
              <Typography
                key={`${item.value}-${i}`}
                variant="subtitle2"
                textAlign="center"
                sx={{
                  fontSize: isSameValue ? '13px' : '12px',
                  fontWeight:
                    dashboardView || dashboardInstitutionsView ? 400 : 250,
                  p: isSameValue ? 0.5 : 0,
                  m: 0,
                  minWidth:
                    isSameValue || dashboardView || dashboardInstitutionsView
                      ? '50px'
                      : undefined,
                  border: isSameValue
                    ? `1px solid ${theme.palette.primary.main}`
                    : undefined,
                  borderRadius:
                    isSameValue || dashboardView || dashboardInstitutionsView
                      ? 1.5
                      : 0,
                  color:
                    isSameValue && !dashboardView && !dashboardInstitutionsView
                      ? theme.palette.primary.main
                      : undefined,
                  py:
                    dashboardView || dashboardInstitutionsView
                      ? 1.5
                      : undefined,
                  px: dashboardInstitutionsView ? 1.5 : undefined,
                  backgroundColor:
                    dashboardView || dashboardInstitutionsView
                      ? theme.palette.background.light
                      : undefined,
                }}
              >
                {cycleView ? (
                  item.label.split(' ').map((word, index) => (
                    <Box key={`${word}-${index}`}>
                      {index < 2
                        ? word +
                          (index === 1 && item.label.split(' ').length > 2
                            ? '...'
                            : '')
                        : undefined}
                      {index < 2 &&
                        index < item.label.split(' ').length - 1 && <br />}
                    </Box>
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
            </Box>
          );
        })}
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
        sx={{ p: 0, m: 0 }}
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
        <ArrowRight
          sx={{ fontSize: 30, color: theme.palette.background.light }}
        />
      </IconButton>
    </Box>
  );
}
