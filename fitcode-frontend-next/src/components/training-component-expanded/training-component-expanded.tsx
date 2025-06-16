import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { AfterSet } from '@/controller/component/type/after-set.type';
import { MainSet } from '@/controller/component/type/main-set.type';
import { Box, Tooltip } from '@mui/material';
import { useState } from 'react';
import SelectInput from '../select-input/select-input';
import { AFTER_SETS, MAIN_SETS } from '../trainer-day-view/constant';
import { TrainingComponent as TrainingComponentClass } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { Method } from '@/controller/method/type/method.type';

interface TrainingComponentExpandedProps {
  training: Training;
  trainingComponent: TrainingComponentClass;
}

export default function TrainingComponentExpanded(
  props: TrainingComponentExpandedProps
) {
  const { training } = props;

  const screenSize = useScreenSize();

  const { setDetectedChanges, trainings, methods: allMethods } = useGroup();

  const { component, setComponent, setTodaysTrainings } =
    useTrainerDayViewContext();

  const [mainSet, setMainSet] = useState<MainSet | null>();
  const [afterSet, setAfterSet] = useState<AfterSet | null>();

  if (!component) return null;

  return (
    <Box
      width={screenSize.isMobile ? '100%' : undefined}
      display={screenSize.isMobile ? 'flex' : undefined}
      flexDirection={screenSize.isMobile ? 'column' : undefined}
      alignItems={screenSize.isMobile ? 'center' : undefined}
      mt={screenSize.isMobile ? 2.5 : 1.5}
    >
      <SelectInput<MainSet>
        label={'Main Set'}
        value={mainSet?.id || ''}
        icon={null}
        items={MAIN_SETS}
        itemKey="id"
        itemName="name"
        placeholder="Main Set"
        disableInputLabel={false}
        setValue={(mainSetId) => {
          setDetectedChanges(true);
          const mainSet = MAIN_SETS.find((g) => g.id === mainSetId)!;

          setMainSet(mainSet);
        }}
      />

      <SelectInput<AfterSet>
        label={'After Set'}
        value={afterSet?.id || ''}
        icon={null}
        items={AFTER_SETS}
        itemKey="id"
        itemName="name"
        placeholder="After Set"
        disableInputLabel={false}
        setValue={(afterSetId) => {
          setDetectedChanges(true);
          const afterSet = AFTER_SETS.find((g) => g.id === afterSetId)!;

          setAfterSet(afterSet);
        }}
      />

      <Tooltip title={component.target ? component.target.name : 'No target'}>
        <SelectInput<Method>
          label={'Method'}
          value={component.method?.id || ''}
          icon={null}
          items={allMethods}
          itemKey="id"
          itemName="name"
          disabled={[WARMUP_ID, COOLDOWN_ID].includes(component.id)}
          sx={{
            maxWidth: 75,
          }}
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

            setTodaysTrainings((prev) =>
              prev.map((t) => {
                if (t.id !== training.id) return t;
                return {
                  ...t,
                  components: updatedComponents,
                };
              })
            );

            setDetectedChanges(true);
          }}
        />
      </Tooltip>
    </Box>
  );
}
