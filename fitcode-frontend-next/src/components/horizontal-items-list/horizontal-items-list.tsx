import { useGroup } from '@/store/group-provider';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useScreenSize } from '@/store/screen-size-provider';
import { useRef } from 'react';

interface TrainerGroupDayViewDaysProps {
  items: { label: string; value: string; sublabel?: string }[];
  value: string;
  setValue: (value: string) => void;
  checkIsSameValue: (value: string) => boolean;
  onArrowClick?: (direction: 'left' | 'right') => void;
  cycleView?: boolean;
  alertOnChange?: boolean;
}

export default function HorizontalItemsList(
  props: TrainerGroupDayViewDaysProps
) {
  const SCROLL_STEP = 150; // Adjust this value as needed
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { items, setValue, onArrowClick, cycleView, checkIsSameValue } = props;

  const { detectedChanges, setDetectedChanges } = useGroup();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      marginX="auto"
      sx={{
        py: 1,
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
          if (cycleView) {
            scrollContainerRef.current?.scrollBy({
              left: -SCROLL_STEP, // adjust scroll distance as needed
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
          onArrowClick?.('left');
        }}
      >
        <ArrowLeft
          sx={{ fontSize: 30, color: theme.palette.background.light }}
        />
      </IconButton>

      {/* Scrollable Days */}
      <Box
        ref={scrollContainerRef} // 👈 Add this
        width="100%"
        sx={{
          display: 'flex',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          mx: 1, // optional spacing between arrows and days
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
                px: isSameValue ? 0 : 2,
                pl: i === 0 ? 0 : undefined,
                pr: i === items.length - 1 ? 0 : undefined,
                cursor: 'pointer',
                flex: '0 0 auto', // important so it doesn't shrink
              }}
              onClick={() => {
                if (props.alertOnChange && detectedChanges) {
                  toast.error('Unsaved changes will be lost', {
                    icon: '⚠️',
                    duration: 2000,
                  });

                  setDetectedChanges(false);
                  return;
                }

                setValue(item.value);
              }}
            >
              <Typography
                key={item.value}
                variant="subtitle2"
                textAlign="center"
                sx={{
                  fontSize: cycleView ? '14px' : isSameValue ? '13px' : '12px',
                  fontWeight: 250,
                  p: isSameValue ? 0.5 : 0,
                  minWidth: isSameValue ? '50px' : undefined,
                  m: 0,
                  border: isSameValue
                    ? `1px solid ${theme.palette.primary.main}`
                    : undefined,
                  borderRadius: isSameValue ? 1.5 : 0,
                  color: isSameValue ? theme.palette.primary.main : undefined,
                }}
              >
                {cycleView ? (
                  item.label.split(' ').map((word, index) => (
                    <>
                      {index < 2
                        ? word +
                          (index === 1 && item.label.split(' ').length > 2
                            ? '...'
                            : '')
                        : undefined}
                      {index < 2 &&
                        index < item.label.split(' ').length - 1 && <br />}
                    </>
                  ))
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

      {/* Right Arrow */}
      <IconButton
        sx={{ p: 0, m: 0 }}
        onClick={() => {
          if (cycleView) {
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
