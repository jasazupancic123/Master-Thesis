import { CommonService } from '@/common/service/common.service';
import { useGroup } from '@/context/group-provider';
import { AfterSet } from '@/controller/component/type/after-set.type';
import { MainSet } from '@/controller/component/type/main-set.type';
import { Method } from '@/controller/component/type/method.type';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import SelectInput from '../select-input';
import { AFTER_SETS, MAIN_SETS, METHODS } from './constant';
import { TrainingComponentProps } from './props';
import Supersets from './supersets';

const commonService = CommonService.instance;

export default function TrainingComponentCard(props: TrainingComponentProps) {
  const { training, trainingComponent } = props;
  const {
    training: selectedTraining,
    setTraining,
    components,
    component,
    setComponent,
  } = useGroup();

  const [mainSet, setMainSet] = useState<MainSet | null>();
  const [afterSet, setAfterSet] = useState<AfterSet | null>();
  const [method, setMethod] = useState<Method | null>();

  return (
    <Box my={1} p={0} px={1}>
      <>
        <Box sx={{ bgcolor: 'background.paper', my: 0.5 }}>
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
                <Box display="flex" p={0}>
                  {trainingComponent.component &&
                    (() => {
                      const IconComponent =
                        commonService.navigation.getComponentIcon(
                          trainingComponent.component.name
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
                            {trainingComponent.component.name}
                          </Typography>
                        </Box>
                      );
                    })()}
                </Box>
              </Box>

              <Box display="flex" p={0} mr={1} alignItems="center">
                <SelectInput<MainSet>
                  label={'Main Set'}
                  value={mainSet?.id || ''}
                  icon={null}
                  items={MAIN_SETS}
                  itemKey="id"
                  itemName="name"
                  placeholder="Main Set"
                  displayInputLabel={true}
                  setValue={(mainSetId) => {
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
                  displayInputLabel={true}
                  setValue={(afterSetId) => {
                    const afterSet = AFTER_SETS.find(
                      (g) => g.id === afterSetId
                    )!;

                    setAfterSet(afterSet);
                  }}
                />

                <SelectInput<MainSet>
                  label={'Method'}
                  value={method?.id || ''}
                  icon={null}
                  items={METHODS}
                  itemKey="id"
                  itemName="name"
                  placeholder="Method"
                  displayInputLabel={true}
                  setValue={(methodId) => {
                    const method = METHODS.find((g) => g.id === methodId)!;
                    setMethod(method);
                  }}
                />

                <IconButton
                  onClick={() => {
                    if (
                      trainingComponent &&
                      component &&
                      trainingComponent.id === component.id
                    ) {
                      setTraining(undefined);
                      setComponent(undefined);
                    } else {
                      setTraining(training);
                      setComponent(() =>
                        components.find((c) => c.id === trainingComponent!.id)
                      );
                    }
                  }}
                >
                  {trainingComponent &&
                  component &&
                  trainingComponent.id === component.id ? (
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
                trainingComponent &&
                component &&
                trainingComponent.id === component.id &&
                training.id === selectedTraining?.id
                  ? undefined
                  : 'none',
            }}
          >
            {/* Supersets */}
            <Supersets trainingComponent={trainingComponent} />
          </Box>
        </Box>
      </>
    </Box>
  );
}
