import {
  KeyboardArrowDown,
  QrCode,
  SettingsBackupRestoreOutlined,
} from '@mui/icons-material';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import React from 'react';
import toast from 'react-hot-toast';

import { DIVIDER_HEIGHT, MAX_WIDTH } from './constant/dimensions.constant';
import useQRCode from './hooks/use-qr-code';
import SelectedMemberReport from '@/components/selected-member/selected-member-report';
import SelectedMemberWelness from '@/components/selected-member/selected-member-welness';
import TrainingMembers from '@/components/training-members/training-members';
import { core } from '@/core/core.service';
import { lib } from '@/lib';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import HorizontalItemsList from '@/ui/horizontal-items-list';
import MyModal from '@/ui/modal';
import { useMain } from '@/store/main.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS } from '@/lib/common/const/nav.const';
import { useRouter } from 'next/navigation';

dayjs.extend(weekOfYear);

interface Props {
  days: { label: string; value: string; sublabel: string }[];
  setDays: (days: { label: string; value: string; sublabel: string }[]) => void;
  week: number;
}

export default function GroupTrainerDayViewHeader({ days, setDays }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const screenSize = useScreenSize();

  const { user, role } = useAuthenticatedAuth();
  const { institution } = useMain();

  const myGroups = lib.firebase.auth.isManager(role)
    ? institution.groups
    : institution.groups.filter((g) => g.trainerIds.includes(user.uid));

  const {
    group,
    trainings,
    setDateFrom,
    setDateTo,
    detectedChanges,
    setDetectedChanges,
  } = useGroup();

  const {
    training,
    component,
    day,
    setDay,
    selectedPeriod,
    setSelectedPeriod,
    selectedAthlete,
    setSelectedExerciseIds,
    setSelectedAthlete,
    setSelectedSubgroup,
    setComponent,
    setTraining,
  } = useTrainerDayView();

  const { qrDataUrl, qrOpen, setQrOpen, generateQRCode, qrCodeSize } =
    useQRCode();

  // const { isSticky } = useTrainerDayViewHeaderSticky();
  const isSticky = false;

  const groupAnchorRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  interface SmallDisplayProps {
    smallDisplay?: boolean;
  }

  function PeriodSelect(props: SmallDisplayProps) {
    const { smallDisplay } = props;
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems={smallDisplay ? 'center' : 'flex-start'}
        ml={smallDisplay ? 0 : 2}
        py={smallDisplay ? 1 : 0}
      >
        <Box
          display="flex"
          flexDirection={smallDisplay ? 'row' : 'column'}
          justifyContent={smallDisplay ? 'center' : undefined}
          gap={smallDisplay ? 4 : 0.5}
        >
          {['AM', 'PM'].map((period) => {
            const isPeriodSelected = selectedPeriod?.value === period;
            return (
              <Box
                key={period}
                display="flex"
                flexDirection={smallDisplay ? 'column-reverse' : 'row'}
                alignItems="center"
                gap={smallDisplay ? 0 : 1}
              >
                <Typography
                  fontSize={12}
                  fontWeight={600}
                  sx={{
                    color: isPeriodSelected
                      ? theme.palette.text.secondary
                      : undefined,
                    cursor: 'pointer',
                    backgroundColor: isPeriodSelected
                      ? theme.palette.primary.main
                      : 'transparent',
                    borderRadius: 18,
                    px: 1,
                  }}
                  onClick={() => {
                    if (detectedChanges) {
                      toast.error('Unsaved changes will be lost', {
                        icon: '⚠️',
                        duration: 2000,
                      });

                      setDetectedChanges(false);
                      return;
                    }
                    const newPeriod = {
                      key: new Date(),
                      value: period as 'AM' | 'PM',
                    };
                    setSelectedPeriod(newPeriod);
                  }}
                >
                  {period}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  }

  const HorizontalItems = () => {
    if (selectedAthlete) return null;

    return (
      <HorizontalItemsList
        items={days}
        value={day.date.toString()}
        setValue={(value) => {
          setDay({ label: '', date: dayjs(value) });
          setDateFrom(dayjs(value).startOf('day'));
          setDateTo(dayjs(value).endOf('day'));
          setSelectedExerciseIds([]);
        }}
        checkIsSameValue={(value: string) => {
          return dayjs(value).isSame(dayjs(day.date), 'day');
        }}
        dayView
        trainings={trainings}
        day={day}
        alertOnChange
        onArrowClick={(direction) => {
          const newDay =
            direction === 'left'
              ? day.date.subtract(1, 'week')
              : day.date.add(1, 'week');

          setDay({ label: '', date: newDay });
          setDateFrom(newDay.startOf('day'));
          setDateTo(newDay.endOf('day'));
          setDays(
            lib.common.date.getWeekDays(newDay).map(({ label, date }) => ({
              label,
              value: date.toString(),
              sublabel: lib.common.date.format(date, {
                withYear: false,
                withMonth: false,
                withoutDots: true,
              }),
            }))
          );
        }}
      />
    );
  };

  const GroupSelection = ({ smallDisplay }: { smallDisplay?: boolean }) => {
    return (
      <Box
        width={160}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        onClick={handleOpen}
        sx={{
          cursor: 'pointer',
          border: `1px solid ${theme.palette.primary.main}`,
          borderRadius: 2,
          backgroundColor: theme.palette.background.dark,
          p: 0.5,
          px: 1,
          my: smallDisplay ? 1 : 0,
        }}
      >
        <Typography
          fontSize={14}
          fontWeight={600}
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >
          {group.name}
        </Typography>
        <KeyboardArrowDown />
      </Box>
    );
  };

  return (
    <Box
      id="trainer-day-view-header"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      width="100%"
      maxWidth={MAX_WIDTH}
      sx={{
        backgroundColor: theme.palette.background.default,
      }}
    >
      {screenSize.isSmallTablet || screenSize.isMobile ? (
        selectedAthlete ? (
          <Box
            display="flex"
            width="100%"
            height={DIVIDER_HEIGHT}
            justifyContent="space-around"
            alignItems="center"
          >
            <Box
              width="25%"
              display="flex"
              justifyContent="center"
              alignItems="center"
              flexDirection="column"
            >
              {training && component && (
                <>
                  <Tooltip title="Generate QR Code" placement="left">
                    <IconButton
                      onClick={() => generateQRCode(selectedAthlete.uid)}
                    >
                      <QrCode sx={{ fontSize: 30, mx: 'auto' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip
                    title="Reset training to group default"
                    placement="left"
                  >
                    <IconButton onClick={() => {}}>
                      <SettingsBackupRestoreOutlined />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
            <Box
              width="50%"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              sx={{
                my: selectedAthlete ? 'auto' : undefined,
              }}
            >
              <SelectedMemberReport />
            </Box>
            <Box width="25%">
              <SelectedMemberWelness />
            </Box>
          </Box>
        ) : (
          <>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              sx={{
                my: selectedAthlete ? 'auto' : undefined,
              }}
            >
              <HorizontalItems />
              <Box ref={groupAnchorRef}>
                <GroupSelection smallDisplay />
              </Box>
              <PeriodSelect smallDisplay />
              <TrainingMembers isSticky={isSticky} />
            </Box>
          </>
        )
      ) : (
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          minHeight={DIVIDER_HEIGHT}
        >
          <Box
            display="flex"
            width="100%"
            height={
              selectedAthlete ? DIVIDER_HEIGHT : `calc(${DIVIDER_HEIGHT} / 2)`
            }
            justifyContent="space-around"
            alignItems="flex-start"
          >
            <Box
              width="25%"
              height="100%"
              display="flex"
              justifyContent="space-between"
            >
              <PeriodSelect />
              <Box
                width="25%"
                height="100%"
                display="flex"
                justifyContent="center"
                alignItems="center"
                flexDirection="column"
              >
                {training && component && selectedAthlete && (
                  <>
                    <Tooltip title="Generate QR Code" placement="left">
                      <IconButton
                        onClick={() => generateQRCode(selectedAthlete.uid)}
                      >
                        <QrCode sx={{ fontSize: 30, mx: 'auto' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title="Reset athlete's training to group default"
                      placement="left"
                    >
                      <IconButton
                        onClick={() => {
                          const updatedComponent =
                            core.training.subgroup.deleteVirtual(
                              selectedAthlete.uid,
                              structuredClone(component)
                            );

                          setSelectedAthlete(undefined);
                          setSelectedSubgroup(null);
                          setComponent(updatedComponent);
                          setTraining((prev) =>
                            !prev
                              ? undefined
                              : {
                                  ...prev,
                                  components: prev.components.map((c) =>
                                    c.id === updatedComponent.id
                                      ? updatedComponent
                                      : c
                                  ),
                                }
                          );
                        }}
                      >
                        <SettingsBackupRestoreOutlined />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>
            <Box
              width="50%"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              sx={{
                my: selectedAthlete ? 'auto' : undefined,
              }}
            >
              {selectedAthlete ? (
                <SelectedMemberReport />
              ) : (
                <>
                  <HorizontalItems />
                </>
              )}
            </Box>
            <Box width="25%" display="flex" justifyContent="flex-end" p={1}>
              {selectedAthlete ? (
                <SelectedMemberWelness />
              ) : (
                <Box ref={groupAnchorRef}>
                  <GroupSelection />
                </Box>
              )}
            </Box>
          </Box>
          {!selectedAthlete && (
            <Box
              display="flex"
              width="100%"
              minHeight={`calc(${DIVIDER_HEIGHT} / 2)`}
              justifyContent="center"
              alignItems="cetner"
              sx={{
                pb: 1,
              }}
            >
              <TrainingMembers isSticky={isSticky} />
            </Box>
          )}
        </Box>
      )}

      <Menu
        anchorEl={groupAnchorRef.current}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {myGroups.map((g) => (
          <MenuItem
            key={g.id}
            onClick={() => {
              handleClose();
              router.push(
                LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS(g.id).home.href
              );
            }}
          >
            {g.name}
          </MenuItem>
        ))}
      </Menu>
      <MyModal
        isOpen={qrOpen}
        onCancel={() => setQrOpen(false)}
        setIsOpen={(open) => setQrOpen(open)}
      >
        <Box p={2} display="flex" flexDirection="column" alignItems="center">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR Code"
              style={{ width: qrCodeSize, height: qrCodeSize }}
            />
          )}
        </Box>
      </MyModal>
    </Box>
  );
}
