import { Box, Tooltip, Typography } from '@mui/material';
import { isBefore } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import MyModal from '../modal/modal';
import SelectInput from '../select-input/select-input';
import { AFTER_SETS } from '../trainer-day-view/constant';
import { onMethodChange } from './state';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { handleApiRequest } from '@/common/type/state.type';
import type { AfterSet } from '@/controller/component/type/after-set.type';
import type { Method } from '@/controller/method/type/method.type';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import { PeriodizationType } from '@/controller/training/enum/periodization-type.enum';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { Superset } from '@/controller/training/type/superset.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import { useGroup } from '@/store/group-provider';
import { useMain } from '@/store/main-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

export default function TrainingComponentHeaderMenu() {
  const router = useRouter();
  const screenSize = useScreenSize();

  const {
    methods: allMethods,
    components: allComponents,
    exercises: allExercises,
  } = useMain();

  const { detectedChanges, setDetectedChanges, trainings, setTrainings } =
    useGroup();

  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedExercises,
    selectedSubgroup,
    setSelectedSubgroup,
  } = useTrainerDayViewContext();

  const [afterSet, setAfterSet] = useState<AfterSet | null>();
  const [selectedPeriodizationType, setSelectedPeriodizationType] =
    useState<PeriodizationType | null>(null);
  const [numTrainingsWithSameTarget, setNumTrainingsWithSameTarget] =
    useState(0);
  const [openModal, setOpenModal] = useState(false);

  const stateUpdate = (updatedComponent: TrainingComponent) => {
    if (!training) return;

    setComponent(updatedComponent);

    const updatedComponents = training.components.map((c) => {
      if (
        c.id === updatedComponent.id ||
        c.component?.id === updatedComponent.component?.id
      ) {
        return {
          ...updatedComponent,
        };
      }
      return c;
    });

    setTraining((prev) =>
      !prev
        ? prev
        : {
            ...prev,
            components: updatedComponents,
          }
    );
  };

  if (!component) return null;

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
          displayEmpty
          disableNoneChoice
          iconSize={17}
          items={Object.values(MainSet)}
          itemKey={undefined}
          itemName={undefined}
          sx={{
            maxWidth: 75,
          }}
          disableInputLabel={false}
          setValue={(newMainSet) => {
            setDetectedChanges(true);
            const mainSet = Object.values(MainSet).find(
              (g) => g === newMainSet
            );

            if (!mainSet) return;

            if (!selectedSubgroup && component.mainSet === mainSet) return;

            if (selectedSubgroup && selectedSubgroup.mainSet === mainSet)
              return;

            const updatedSupersets = [{ exercises: [] }] as Superset[];

            const exercises = (selectedSubgroup || component).supersets.flatMap(
              (s) => s.exercises
            );

            if (mainSet === MainSet.BLOCK) {
              exercises.forEach((e, i) => {
                // limit to 32 exercises
                if (i > 31) return;

                if (
                  updatedSupersets[updatedSupersets.length - 1].exercises
                    .length === 4
                )
                  updatedSupersets.push({
                    exercises: [],
                  });

                updatedSupersets[updatedSupersets.length - 1].exercises.push(e);
              });
            } else {
              // circuit
              exercises.forEach((e, i) => {
                // limit to 32 exercises
                if (i > 31) return;

                updatedSupersets[0].exercises.push(e);
              });
            }

            const updatedComponent = { ...component };
            if (selectedSubgroup) {
              const updatedSubgroup = {
                ...selectedSubgroup,
                supersets: updatedSupersets,
                mainSet,
              };

              setSelectedSubgroup(updatedSubgroup);

              updatedComponent.subgroups = component.subgroups.map((s) =>
                s.id === updatedSubgroup.id ? updatedSubgroup : s
              );
            } else {
              updatedComponent.supersets = updatedSupersets;
              updatedComponent.mainSet = mainSet;
            }

            setComponent(updatedComponent);

            setTraining((prev) => {
              if (!prev) return prev;

              return {
                ...prev,
                components: prev.components.map((c) =>
                  c.id === updatedComponent.id ? updatedComponent : c
                ),
              };
            });
          }}
          selectSize="small"
          inputLabelSize={'12px'}
          selectedItemSize={12}
        />
      </Tooltip>

      <Tooltip title="After Set">
        <SelectInput<AfterSet>
          label={'After Set'}
          value={afterSet?.id || ''}
          icon={null}
          displayEmpty
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
          disabled={[WARMUP_ID, COOLDOWN_ID].includes(component.id)}
          sx={{
            maxWidth: 75,
          }}
          sameValueAction
          inputLabelSize={'12px'}
          selectedItemSize={12}
          selectSize="small"
          setValue={(periodizationType) => {
            if (detectedChanges) {
              toast.error('Save training first', {
                icon: '⚠️',
                duration: 3000,
              });
              return;
            }

            if (!periodizationType) {
              if (!selectedSubgroup) {
                setComponent({
                  ...component,
                  periodizationType: undefined,
                });
              } else {
                setSelectedSubgroup((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    periodizationType: undefined,
                  };
                });
              }
              return;
            }

            if (!training) return;

            if (
              periodizationType !== PeriodizationType.REPLICATE &&
              !selectedExercises.length
            ) {
              toast.error('Select exercises to periodize');
              return;
            }

            let numTrainingsWithSameTarget = 0;
            trainings.forEach((t) => {
              if (training.id === t.id || isBefore(t.from, training.from))
                return;

              const sameComponent = t.components.find(
                (c) =>
                  c.id === component.id ||
                  c.component?.id === component.component?.id
              );
              if (!sameComponent) return;

              if (!component.target && !sameComponent.target) {
                // if no traget is selected, count the ones without a target
                numTrainingsWithSameTarget++;
              } else if (sameComponent.target?.id === component.target?.id)
                numTrainingsWithSameTarget++;
            });

            setSelectedPeriodizationType(
              periodizationType as PeriodizationType | null
            );
            setNumTrainingsWithSameTarget(numTrainingsWithSameTarget);
            setOpenModal(true);
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
          disabled={[WARMUP_ID, COOLDOWN_ID].includes(component.id)}
          sx={{
            maxWidth: 75,
          }}
          inputLabelSize={'12px'}
          selectedItemSize={12}
          selectSize="small"
          setValue={(methodId) => {
            if (typeof methodId !== 'string' || !training) return;

            // in supersets.tsx, a useEffect gets called to update setsNumbers if method limits them
            onMethodChange(
              {
                methodId,
              },
              {
                training,
                setTraining,
                component,
                setComponent,
                allMethods,
                setDetectedChanges,
                selectedSubgroup,
                setSelectedSubgroup,
              }
            );
          }}
        />
      </Tooltip>

      <MyModal
        isOpen={openModal}
        setIsOpen={(open) => setOpenModal(open)}
        onCancel={() => {
          setNumTrainingsWithSameTarget(0);
          setSelectedPeriodizationType(null);
          setOpenModal(false);
        }}
        onConfirm={() => {
          if (!training) return;

          handleApiRequest(
            router,
            () =>
              TrainingController.periodize(training.id, component.id, {
                periodizationType:
                  selectedPeriodizationType as PeriodizationType,
                exerciseIds: selectedExercises.map((e) => e.id),
                subgroupId: selectedSubgroup?.id,
              }),
            (periodizedTrainings) => {
              periodizedTrainings.map((pt) => {
                TrainingService.mapData(pt, {
                  components: allComponents,
                  exercises: allExercises,
                  methods: allMethods,
                });

                return pt;
              });

              const currentTraining = periodizedTrainings.find(
                (t) => t.id === training.id
              );
              if (currentTraining) setTraining(currentTraining);

              setTrainings((prev) =>
                prev.map((t) => {
                  const newTraining = periodizedTrainings.find(
                    (nt) => nt.id === t.id
                  );

                  return newTraining ? newTraining : t;
                })
              );

              if (selectedSubgroup) {
                setSelectedSubgroup((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    periodizationType: selectedPeriodizationType
                      ? (selectedPeriodizationType as PeriodizationType)
                      : undefined,
                  };
                });

                const updatedComponent: TrainingComponent = {
                  ...component,
                  subgroups: (component.subgroups || []).map((sg) => {
                    if (sg.id === selectedSubgroup?.id) {
                      return {
                        ...sg,
                        periodizationType: selectedPeriodizationType
                          ? (selectedPeriodizationType as PeriodizationType)
                          : undefined,
                      };
                    }
                    return sg;
                  }),
                };

                stateUpdate(updatedComponent);
              } else {
                const updatedComponent = {
                  ...component,
                  periodizationType: selectedPeriodizationType
                    ? (selectedPeriodizationType as PeriodizationType)
                    : undefined,
                };

                stateUpdate(updatedComponent);
              }

              setNumTrainingsWithSameTarget(0);
              setSelectedPeriodizationType(null);
              setOpenModal(false);

              toast.success(
                `${selectedSubgroup ? 'Subgroups' : 'Trainings'} periodized successfully`
              );
            },
            undefined,
            'Failed to periodize trainings'
          );
        }}
        cancelText="Close"
      >
        {selectedSubgroup && (
          <Typography variant="body1" textAlign="center" mb={1}>
            {`Periodizing subgroup ${selectedSubgroup.name}`}
          </Typography>
        )}
        <Typography variant="body1" textAlign="center">
          Periodize {numTrainingsWithSameTarget} other trainings with type{' '}
          {selectedPeriodizationType}?
        </Typography>
      </MyModal>
    </Box>
  );
}
