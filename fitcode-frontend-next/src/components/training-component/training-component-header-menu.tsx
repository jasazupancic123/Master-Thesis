import { Box, IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';

import { handleSetPeriodizationType } from './actions/actions-periodization-type';
import PeriodizeModal from './periodize-modal';
import { AFTER_SETS } from '@/components/trainer-group-day-view/constant/after-sets.constant';
import { core } from '@/core/core.service';
import type { AfterSet } from '@/core/exercise/type/after-set.type';
import type { Method } from '@/core/exercise/type/method.type';
import { PeriodizationType } from '@/core/training/enum/periodization-type.enum';
import { lib } from '@/lib';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import SelectInput from '@/ui/select-input/select-input';

const WarmupIcon = lib.common.component.getIcon('warmup');
const CooldownIcon = lib.common.component.getIcon('cooldown');

export default function TrainingComponentHeaderMenu() {
  const screenSize = useScreenSize();

  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayView();

  const { setDetectedChanges } = groupContext;

  const {
    training,
    component,
    selectedSubgroup,
    selectedAthlete,
    addWarmupSuperset,
    addCooldownSuperset,
    applyMethod,
  } = trainerDayViewContext;

  const [afterSet, setAfterSet] = useState<AfterSet | null>();
  const [selectedPeriodizationType, setSelectedPeriodizationType] =
    useState<PeriodizationType | null>(null);
  const [numTrainingsWithSameTarget, setNumTrainingsWithSameTarget] =
    useState(0);
  const [openPeriodizationModal, setOpenPeriodizationModal] = useState(false);

  const [method, setMethod] = useState<Method | null>(null);

  if (!training || !component) return null;
  const methodologies = core.training.component.findMethodologies(component.id);

  return (
    <>
      <Box
        width={screenSize.isSmallerThanLaptop ? '100%' : undefined}
        display={screenSize.isSmallerThanLaptop ? 'flex' : undefined}
        alignItems={screenSize.isMobile ? 'center' : undefined}
        justifyContent={
          screenSize.isSmallerThanLaptop && !screenSize.isMobile
            ? 'center'
            : undefined
        }
        sx={{ overflowX: screenSize.isMobile ? 'scroll' : undefined }}
        mt={1.5}
        pt={screenSize.isMobile ? 1 : undefined}
        flexWrap="nowrap"
        gap={screenSize.isSmallerThanLaptop ? 1 : 0}
      >
        <Tooltip title="Add warmup set">
          <IconButton onClick={addWarmupSuperset} size="small">
            {WarmupIcon ? <WarmupIcon sx={{ width: 15, height: 15 }} /> : null}
          </IconButton>
        </Tooltip>

        <Tooltip title="Add cooldown set">
          <IconButton onClick={addCooldownSuperset} size="small">
            {CooldownIcon ? (
              <CooldownIcon sx={{ width: 15, height: 15 }} />
            ) : null}
          </IconButton>
        </Tooltip>

        {methodologies.length > 0 && (
          <Tooltip title="Main Set">
            <SelectInput<Method>
              label={'Methods'}
              value={(method?.field as string) || ''}
              icon={null}
              displayEmpty
              disabled={selectedAthlete !== undefined}
              iconSize={17}
              inputLabelSize={'12px'}
              selectedItemSize={12}
              selectSize="small"
              sx={{ maxWidth: 75 }}
              items={methodologies}
              itemKey="field"
              itemName="name"
              placeholder="None"
              disableInputLabel={false}
              setValue={(newMethod) => {
                const method = methodologies.find((m) => m.field === newMethod);
                if (method) applyMethod(method);
                setMethod(method || null);
              }}
            />
          </Tooltip>
        )}

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
            sx={{ maxWidth: 75 }}
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
            disabled={selectedAthlete !== undefined}
            sx={{ maxWidth: 75 }}
            sameValueAction
            inputLabelSize={'12px'}
            selectedItemSize={12}
            selectSize="small"
            setValue={(periodizationType) => {
              handleSetPeriodizationType(
                {
                  periodizationType,
                  setOpenModal: setOpenPeriodizationModal,
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

        <PeriodizeModal
          open={openPeriodizationModal}
          setOpen={setOpenPeriodizationModal}
          selectedPeriodizationType={selectedPeriodizationType}
          setSelectedPeriodizationType={setSelectedPeriodizationType}
          numTrainingsWithSameTarget={numTrainingsWithSameTarget}
          setNumTrainingsWithSameTarget={setNumTrainingsWithSameTarget}
        />
      </Box>
    </>
  );
}
