import { Box, IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { handleSetPeriodizationType } from './actions/actions-periodization-type';
import PeriodizeModal from './periodize-modal';
import ProtocolModal from './protocol-modal';
import { AFTER_SETS } from '@/components/trainer-group-day-view/constant/after-sets.constant';
import { core } from '@/core/core.service';
import type { AfterSet } from '@/core/exercise/type/after-set.type';
import type { Method } from '@/core/exercise/type/method.type';
import { PeriodizationType } from '@/core/training/enum/periodization-type.enum';
import { TrainingController } from '@/core/training/training.controller';
import type { Superset } from '@/core/training/type/superset.type';
import type { TrainingProtocol } from '@/core/training/type/training-protocol.type';
import { lib } from '@/lib';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import SelectInput from '@/ui/select-input/select-input';

const TEMP_PROTOCOL_ID = '__create_new__';

export default function TrainingComponentHeaderMenu() {
  const screenSize = useScreenSize();
  const { protocols, setProtocols } = useMain();
  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayView();
  const { setDetectedChanges, institution } = groupContext;

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
  const [method, setMethod] = useState<Method | null>(null);
  const [protocol, setProtocol] = useState<TrainingProtocol | null>(null);

  // periodization
  const [selectedPeriodizationType, setSelectedPeriodizationType] =
    useState<PeriodizationType | null>(null);
  const [numTrainingsWithSameTarget, setNumTrainingsWithSameTarget] =
    useState(0);
  const [openPeriodizationModal, setOpenPeriodizationModal] = useState(false);

  if (!training || !component) return null;
  const methodologies = core.training.component.findMethodologies(component.id);

  const warmupExists = (selectedSubgroup || component).supersets.some(
    (s: Superset) => s.warmup
  );

  const cooldownExists = (selectedSubgroup || component).supersets.some(
    (s: Superset) => s.cooldown
  );

  const WarmupIcon = lib.common.component.getIcon('warmup');
  const CooldownIcon = lib.common.component.getIcon('cooldown');

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
        <Tooltip title={warmupExists ? 'Remove warmup set' : 'Add warmup set'}>
          <IconButton onClick={addWarmupSuperset} size="small">
            {WarmupIcon ? <WarmupIcon sx={{ width: 15, height: 15 }} /> : null}
          </IconButton>
        </Tooltip>

        <Tooltip
          title={cooldownExists ? 'Remove cooldown set' : 'Add cooldown set'}
        >
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

        <Tooltip title="Training Protocol">
          <SelectInput<TrainingProtocol>
            label={'Protocol'}
            value={protocol?.id || ''}
            icon={null}
            displayEmpty
            disabled={selectedAthlete !== undefined}
            iconSize={17}
            inputLabelSize={'12px'}
            selectedItemSize={12}
            selectSize="small"
            sx={{ maxWidth: 75 }}
            items={protocols.filter((p) => p.componentId === component.id)}
            itemKey="id"
            itemName="name"
            placeholder="None"
            disableInputLabel={false}
            setValue={(protocolId) => {
              if (protocolId === TEMP_PROTOCOL_ID) return;

              setDetectedChanges(true);
              const protocol = protocols.find((g) => g.id === protocolId)!;
              setProtocol(protocol);
            }}
            onCreateNew={() => {
              const protocol: TrainingProtocol = {
                institutionId: institution.id,
                id: TEMP_PROTOCOL_ID,
                componentId: component.id,
                name: '',
                supersets: selectedSubgroup
                  ? selectedSubgroup.supersets
                  : component.supersets,
              };

              setProtocol(protocol);
            }}
          />
        </Tooltip>

        <ProtocolModal
          data={protocol}
          setData={setProtocol}
          open={!!protocol}
          setOpen={(open) => (open ? setProtocol(protocol) : setProtocol(null))}
          onConfirm={async (data) => {
            try {
              // if protocol already exists, update it
              if (data.id !== TEMP_PROTOCOL_ID) {
                await TrainingController.getInstance().updateProtocol(
                  institution.id,
                  data.id,
                  {
                    name: data.name,
                    supersets: data.supersets,
                    ...(data?.description
                      ? { description: data.description }
                      : {}),
                  }
                );

                const updatedProtocols = protocols.map((p) =>
                  p.id === data.id ? data : p
                );

                setProtocols(updatedProtocols);
                setProtocol(null);
                toast.success('Protocol updated successfully');
                return;
              }

              // create new protocol
              const protocol =
                await TrainingController.getInstance().createProtocol(
                  institution.id,
                  data
                );

              setProtocols((prev) => [...prev, protocol]);
              setProtocol(null);
              toast.success('Protocol created successfully');
            } catch (e) {
              console.error('Error creating protocol', e);
              toast.error(`Error creating protocol: ${(e as Error).message}`);
            }
          }}
          onDelete={async (protocolId) => {
            if (protocolId === TEMP_PROTOCOL_ID) {
              const updatedProtocols = protocols.filter(
                (p) => p.id !== TEMP_PROTOCOL_ID
              );

              setProtocols(updatedProtocols);
              setProtocol(null);
              return;
            }

            try {
              await TrainingController.getInstance().deleteProtocol(
                institution.id,
                protocolId
              );

              const updatedProtocols = protocols.filter(
                (p) => p.id !== protocolId
              );

              setProtocols(updatedProtocols);
              setProtocol(null);
              toast.success('Protocol deleted successfully');
            } catch (e) {
              console.error('Error deleting protocol', e);
              toast.error(`Error deleting protocol: ${(e as Error).message}`);
            }
          }}
        />

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
