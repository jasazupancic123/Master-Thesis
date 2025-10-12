import { Box, Tooltip } from '@mui/material';

import SelectInput from '../../../util/select-input/select-input';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { AfterSet } from '@/controller/component/type/after-set.type';
import type { Method } from '@/controller/method/type/method.type';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import { PeriodizationType } from '@/controller/training/enum/periodization-type.enum';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import { handleSetMainSet } from './actions/actions-main-set';
import { handleSetPeriodizationType } from './actions/actions-periodization-type';
import { onMethodChange } from './actions/actions-method';
import PeriodizeModal from './modals/periodize-modal';
import { useState } from 'react';
import { AFTER_SETS } from '@/components/trainer-group-day-view/constant/after-sets.constant';

export default function TrainingComponentHeaderMenu() {
  const screenSize = useScreenSize();

  const { methods: allMethods } = useMain();

  const mainContext = useMain();
  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayViewContext();

  const { setDetectedChanges } = groupContext;

  const { training, component, selectedSubgroup, selectedAthlete } =
    trainerDayViewContext;

  const [afterSet, setAfterSet] = useState<AfterSet | null>();
  const [selectedPeriodizationType, setSelectedPeriodizationType] =
    useState<PeriodizationType | null>(null);
  const [numTrainingsWithSameTarget, setNumTrainingsWithSameTarget] =
    useState(0);
  const [openModal, setOpenModal] = useState(false);

  if (!training || !component) return null;

  return (
    <Box
      width={screenSize.isSmallerThanLaptop ? '100%' : undefined}
      display={screenSize.isSmallerThanLaptop ? 'flex' : undefined}
      alignItems={screenSize.isMobile ? 'center' : undefined}
      justifyContent={
        screenSize.isSmallerThanLaptop && !screenSize.isMobile
          ? 'center'
          : undefined
      }
      sx={{
        overflowX: screenSize.isMobile ? 'scroll' : undefined,
      }}
      mt={1.5}
      pt={screenSize.isMobile ? 1 : undefined}
      flexWrap="nowrap"
      gap={screenSize.isSmallerThanLaptop ? 1 : 0}
    >
      <Tooltip title="Main Set">
        <SelectInput<MainSet>
          label={'Main Set'}
          value={selectedSubgroup?.mainSet || component.mainSet}
          icon={null}
          disabled={selectedAthlete !== undefined}
          displayEmpty
          disableNoneChoice
          iconSize={17}
          items={Object.values(MainSet)}
          itemKey={undefined}
          itemName={undefined}
          selectSize="small"
          inputLabelSize={'12px'}
          selectedItemSize={12}
          sx={{
            maxWidth: 75,
          }}
          disableInputLabel={false}
          setValue={(newMainSet) => {
            handleSetMainSet(
              { newMainSet },
              {
                useGroup: groupContext,
                useTrainerDayViewContext: {
                  ...trainerDayViewContext,
                  training,
                  component,
                },
              }
            );
          }}
        />
      </Tooltip>

      <Tooltip title="After Set">
        <SelectInput<AfterSet>
          label={'After Set'}
          value={afterSet?.id || ''}
          icon={null}
          displayEmpty
          disabled={selectedAthlete !== undefined}
          iconSize={17}
          inputLabelSize={'12px'}
          selectedItemSize={12}
          selectSize="small"
          sx={{
            maxWidth: 75,
          }}
          items={AFTER_SETS}
          itemKey="id"
          itemName="name"
          placeholder="None"
          disableInputLabel={false}
          setValue={(afterSetId) => {
            setDetectedChanges(true);
            const afterSet = AFTER_SETS.find((g) => g.id === afterSetId)!;

            setAfterSet(afterSet);
          }}
        />
      </Tooltip>

      <Tooltip
        title={
          selectedSubgroup
            ? selectedSubgroup.periodizationType || 'No Periodization Type'
            : component.periodizationType || 'No Periodization Type'
        }
      >
        <SelectInput<PeriodizationType>
          label="Periodization"
          value={
            selectedSubgroup
              ? selectedSubgroup.periodizationType || ''
              : component.periodizationType || ''
          }
          icon={null}
          items={Object.values(PeriodizationType)}
          itemKey={undefined}
          displayEmpty
          iconSize={17}
          itemName={undefined}
          disabled={
            selectedAthlete !== undefined ||
            [WARMUP_ID, COOLDOWN_ID].includes(component.id)
          }
          sx={{
            maxWidth: 75,
          }}
          sameValueAction
          inputLabelSize={'12px'}
          selectedItemSize={12}
          selectSize="small"
          setValue={(periodizationType) => {
            handleSetPeriodizationType(
              {
                periodizationType,
                setOpenModal,
                setSelectedPeriodizationType,
                setNumTrainingsWithSameTarget,
              },
              {
                useTrainerDayViewContext: {
                  ...trainerDayViewContext,
                  training,
                  component,
                },
                useGroup: groupContext,
              }
            );
          }}
        />
      </Tooltip>

      <Tooltip title={component.method ? component.method.name : 'No method'}>
        <SelectInput<Method>
          label={'Method'}
          value={component.method?.id || ''}
          icon={null}
          displayEmpty
          iconSize={17}
          items={allMethods.filter((m) => m.componentId === component.id)}
          itemKey="id"
          itemName="name"
          disabled={
            selectedAthlete !== undefined ||
            [WARMUP_ID, COOLDOWN_ID].includes(component.id)
          }
          sx={{
            maxWidth: 75,
          }}
          inputLabelSize={'12px'}
          selectedItemSize={12}
          selectSize="small"
          setValue={(methodId) => {
            if (typeof methodId !== 'string') return;

            // in supersets.tsx, a useEffect gets called to update setsNumbers if method limits them
            onMethodChange(
              {
                methodId,
              },
              {
                useMain: mainContext,
                useGroup: groupContext,
                useTrainerDayViewContext: {
                  ...trainerDayViewContext,
                  training,
                  component,
                },
              }
            );
          }}
        />
      </Tooltip>

      <PeriodizeModal
        open={openModal}
        setOpen={setOpenModal}
        selectedPeriodizationType={selectedPeriodizationType}
        setSelectedPeriodizationType={setSelectedPeriodizationType}
        numTrainingsWithSameTarget={numTrainingsWithSameTarget}
        setNumTrainingsWithSameTarget={setNumTrainingsWithSameTarget}
      />
    </Box>
  );
}
