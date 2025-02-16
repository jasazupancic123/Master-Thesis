import { useState } from 'react';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Stack, IconButton, Box, Typography } from '@mui/material';
import { Fragment } from 'react';
import { FilteredExercises, TrainingComponentProps } from './type';
import { Training } from '@/controller/training/type/training.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { SetState } from '@/common/type/state.type';
import { MainSet } from '@/controller/component/type/main-set.type';
import SelectInput from '../select-input';
import { AfterSet } from '@/controller/component/type/after-set.type';
import { Method } from '@/controller/component/type/method.type';
import Supersets from './supersets';
import { CommonService } from '@/common/service/common.service';
import { AFTER_SETS, MAIN_SETS, METHODS } from './constant';
import { after } from 'node:test';

const commonService = CommonService.instance;

export default function TrainingComponentCard(props: TrainingComponentProps) {
  const {
    token,
    training,
    setSelectedTraining,
    component,
    components,
    exercises,
    setSelectedTrainings,
    filteredExercises,
    setFilteredExercises,
    i,
    openComponent,
    setOpenComponent,
  } = props;

  const [selectedMainSet, setSelectedMainSet] = useState<MainSet | null>();
  const [selectedAfterSet, setSelectedAfterSet] = useState<AfterSet | null>();
  const [selectedMethod, setSelectedMethod] = useState<Method | null>();

  return (
    <Box my={1} p={0} px={1}>
      <Fragment key={i}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            my: 0.5,
          }}
        >
          <Box
            height={40}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              mt={1}
              width="100%"
              justifyContent="space-between"
            >
              <Box display="flex" p={0} justifyContent="center">
                {component.component && (
                  <Box display="flex" p={0}>
                    {(() => {
                      const IconComponent =
                        commonService.navigation.getComponentIcon(
                          component.component.name
                        );

                      return (
                        <Box display="flex" alignItems="center">
                          <IconComponent fontSize="medium" color="primary" />
                          <Typography
                            variant="h6"
                            sx={{
                              color: '#1EB980',
                              pl: 1,
                              mb: 0,
                              textTransform: 'uppercase',
                              fontWeight: 'bold',
                            }}
                          >
                            {component.component.name}
                          </Typography>
                        </Box>
                      );
                    })()}
                  </Box>
                )}
              </Box>

              <Box display="flex" p={0} mr={1} alignItems="center">
                <SelectInput<MainSet>
                  label={'Main Set'}
                  value={selectedMainSet?.id || ''}
                  icon={null}
                  items={MAIN_SETS}
                  itemKey="id"
                  itemName="name"
                  setValue={(mainSetId) => {
                    const mainSet = MAIN_SETS.find((g) => g.id === mainSetId)!;
                    setSelectedMainSet(mainSet);
                  }}
                  placeholder="Main Set"
                  displayInputLabel={true}
                />

                <SelectInput<AfterSet>
                  label={'After Set'}
                  value={selectedAfterSet?.id || ''}
                  icon={null}
                  items={AFTER_SETS}
                  itemKey="id"
                  itemName="name"
                  setValue={(afterSetId) => {
                    const afterSet = AFTER_SETS.find(
                      (g) => g.id === afterSetId
                    )!;

                    setSelectedAfterSet(afterSet);
                  }}
                  placeholder="After Set"
                  displayInputLabel={true}
                />

                <SelectInput<MainSet>
                  label={'Method'}
                  value={selectedMethod?.id || ''}
                  icon={null}
                  items={METHODS}
                  itemKey="id"
                  itemName="name"
                  setValue={(methodId) => {
                    const method = METHODS.find((g) => g.id === methodId)!;
                    setSelectedMethod(method);
                  }}
                  placeholder="Method"
                  displayInputLabel={true}
                />

                <IconButton
                  onClick={() => {
                    if (
                      openComponent.componentId === component.id &&
                      openComponent.trainingId === training.id
                    )
                      setOpenComponent({
                        componentId: null,
                        trainingId: null,
                      });
                    else
                      setOpenComponent({
                        componentId: component.id,
                        trainingId: training.id,
                      });
                  }}
                >
                  {openComponent.componentId === component.id &&
                  training.id === openComponent.trainingId ? (
                    <VisibilityOff />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
              </Box>
            </Stack>
          </Box>

          <Box
            bgcolor="background.paper"
            p={2}
            sx={{
              display:
                openComponent.componentId === component.id &&
                training.id === openComponent.trainingId
                  ? undefined
                  : 'none',
            }}
          >
            {/* Supersets */}
            <Supersets
              supersets={component.supersets || []}
              token={token}
              training={training}
              component={component}
              components={components}
              exercises={exercises}
              setSelectedTrainings={setSelectedTrainings}
              setSelectedTraining={setSelectedTraining}
              filteredExercises={filteredExercises}
              setFilteredExercises={setFilteredExercises}
            />
          </Box>
        </Box>
      </Fragment>
    </Box>
  );
}
