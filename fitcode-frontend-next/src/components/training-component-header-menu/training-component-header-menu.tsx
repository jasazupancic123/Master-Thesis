import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { AfterSet } from '@/controller/component/type/after-set.type';
import { MainSet } from '@/controller/component/type/main-set.type';
import { Box, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import SelectInput from '../select-input/select-input';
import { AFTER_SETS, MAIN_SETS } from '../trainer-day-view/constant';
import { Training } from '@/controller/training/type/training.type';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { Method } from '@/controller/method/type/method.type';
import { PeriodizationType } from '@/controller/training/enum/periodization-type.enum';
import MyModal from '../modal/modal';
import { handleApiRequest } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { isBefore } from 'date-fns';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { useMain } from '@/store/main-provider';

interface TrainingComponentExpandedProps {
  training: Training;
}

export default function TrainingComponentHeaderMenu(
  props: TrainingComponentExpandedProps
) {
  const { training } = props;

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
    setTraining,
    component,
    setComponent,
    selectedExercises,
    selectedSubgroup,
    setSelectedSubgroup,
  } = useTrainerDayViewContext();

  const [mainSet, setMainSet] = useState<MainSet | null>();
  const [afterSet, setAfterSet] = useState<AfterSet | null>();
  const [selectedPeriodizationType, setSelectedPeriodizationType] =
    useState<PeriodizationType | null>(null);
  const [numTrainingsWithSameTarget, setNumTrainingsWithSameTarget] =
    useState(0);
  const [openModal, setOpenModal] = useState(false);

  const stateUpdate = (updatedComponent: TrainingComponent) => {
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
      flexDirection={screenSize.isMobile ? 'column' : undefined}
      mt={1.5}
      flexWrap="nowrap"
      gap={screenSize.isSmallerThanLaptop ? 1 : 0}
    >
      <Tooltip title="Main Set">
        <SelectInput<MainSet>
          label={'Main Set'}
          value={mainSet?.id || ''}
          icon={null}
          displayEmpty
          iconSize={17}
          items={MAIN_SETS}
          itemKey="id"
          itemName="name"
          sx={{
            maxWidth: 75,
          }}
          placeholder="None"
          disableInputLabel={false}
          setValue={(mainSetId) => {
            setDetectedChanges(true);
            const mainSet = MAIN_SETS.find((g) => g.id === mainSetId)!;

            setMainSet(mainSet);
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
          selectedSubgroup?.subgroup
            ? selectedSubgroup.subgroup.periodizationType ||
              'No Periodization Type'
            : component.periodizationType || 'No Periodization Type'
        }
      >
        <SelectInput<PeriodizationType>
          label="Periodization"
          value={
            selectedSubgroup?.subgroup
              ? selectedSubgroup?.subgroup.periodizationType || ''
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
              if (!selectedSubgroup?.subgroup) {
                setComponent({
                  ...component,
                  periodizationType: undefined,
                });
              } else {
                setSelectedSubgroup((prev) => {
                  if (!prev || !prev.subgroup) return prev;
                  return {
                    ...prev,
                    subgroup: {
                      ...prev.subgroup,
                      periodizationType: undefined,
                    },
                  };
                });
              }
              return;
            }

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

      <Tooltip title={component.target ? component.target.name : 'No target'}>
        <SelectInput<Method>
          label={'Method'}
          value={component.method?.id || ''}
          icon={null}
          displayEmpty
          iconSize={17}
          items={allMethods}
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
            const method = allMethods.find((m) => m.id === methodId);

            const updatedComponent = {
              ...component,
              method: method,
              methodId: method?.id,
              supersets: component.supersets?.map((s) => ({
                ...s,
                exercises: s.exercises.map((e) => ({
                  ...e,
                  attributeRanges: method?.attributeRanges || [],
                  sets: e.sets.map((set) => ({
                    ...set,
                    paramValuesL: set.paramValuesL.map((p) => {
                      let attributeRange = method?.attributeRanges.find(
                        (ar) => ar.field === p.field
                      );
                      if (!attributeRange) return p;

                      const foundInOptions = attributeRange.options?.find(
                        (o) => o.field === p.selected
                      );
                      if (foundInOptions) attributeRange = foundInOptions;

                      try {
                        const numValue = parseFloat(p.value);
                        if (
                          attributeRange.min !== undefined &&
                          numValue < attributeRange.min
                        ) {
                          return {
                            ...p,
                            value: attributeRange.min.toString(),
                          };
                        }
                        if (
                          attributeRange.max !== undefined &&
                          numValue > attributeRange.max
                        ) {
                          return {
                            ...p,
                            value: attributeRange.max.toString(),
                          };
                        }
                        return p;
                      } catch (e) {
                        return p;
                      }
                    }),
                    paramValuesR: set.paramValuesR.map((p) => {
                      let attributeRange = method?.attributeRanges.find(
                        (ar) => ar.field === p.field
                      );
                      if (!attributeRange) return p;

                      const foundInOptions = attributeRange.options?.find(
                        (o) => o.field === p.selected
                      );
                      if (foundInOptions) attributeRange = foundInOptions;

                      try {
                        const numValue = parseFloat(p.value);
                        if (
                          attributeRange.min !== undefined &&
                          numValue < attributeRange.min
                        ) {
                          return {
                            ...p,
                            value: attributeRange.min.toString(),
                          };
                        }
                        if (
                          attributeRange.max !== undefined &&
                          numValue > attributeRange.max
                        ) {
                          return {
                            ...p,
                            value: attributeRange.max.toString(),
                          };
                        }
                        return p;
                      } catch (e) {
                        return p;
                      }
                    }),
                  })),
                })),
              })),
            };

            setComponent(updatedComponent);

            const updatedComponents = training.components.map((c) => {
              if (
                c.id === component.id ||
                c.component?.id === component.component?.id
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

            setDetectedChanges(true);
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
          handleApiRequest(
            router,
            () =>
              TrainingController.periodize({
                baseTrainingId: training.id,
                componentId: component.id,
                periodizationType:
                  selectedPeriodizationType as PeriodizationType,
                exerciseIds: selectedExercises.map((e) => e.id),
                subgroupId: selectedSubgroup?.subgroup?.id,
              }),
            (periodizedTrainings) => {
              periodizedTrainings.map((pt) => {
                TrainingService.mapComponentsExercisesMethods(
                  pt,
                  allComponents,
                  allExercises,
                  allMethods
                );
              });

              const minimalPeriodizedTrainings = periodizedTrainings.map((t) =>
                TrainingService.convertFromTrainingToTrainingMinimal(t)
              );

              setTrainings((prev) =>
                prev.map((t) => {
                  const newTraining = minimalPeriodizedTrainings.find(
                    (nt) => nt.id === t.id
                  );
                  return newTraining ? newTraining : t;
                })
              );

              if (selectedSubgroup?.subgroup) {
                setSelectedSubgroup((prev) => {
                  if (!prev || !prev.subgroup) return prev;
                  return {
                    ...prev,
                    subgroup: {
                      ...prev.subgroup,
                      periodizationType: selectedPeriodizationType
                        ? (selectedPeriodizationType as PeriodizationType)
                        : undefined,
                    },
                  };
                });

                const updatedComponent: TrainingComponent = {
                  ...component,
                  subgroups: (component.subgroups || []).map((sg) => {
                    if (sg.id === selectedSubgroup.subgroup?.id) {
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
                `${selectedSubgroup?.subgroup ? 'Subgroups' : 'Trainings'} periodized successfully`
              );
            },
            undefined,
            'Failed to periodize trainings'
          );
        }}
        cancelText="Close"
      >
        {selectedSubgroup?.subgroup && (
          <Typography variant="body1" textAlign="center" mb={1}>
            {selectedSubgroup?.subgroup &&
              `Periodizing subgroup ${selectedSubgroup.subgroup.name}`}
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
