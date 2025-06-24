import { SetState } from '@/common/type/state.type';
import { useGroup } from '@/store/group-provider';
import { Component } from '@/controller/component/type/component.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SelectInput from '../select-input/select-input';
import CycleComponentsSelect from '../training-year-cycle-components-select/training-year-cycle-components-select';
import { useTheme } from '@mui/material';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';

interface CycleComponentsProps {
  selectedGroup: Group;
  setSelectedGroup: SetState<Group>;
  setEditModal: SetState<boolean>;
  setEditCycle: React.Dispatch<React.SetStateAction<Cycle | null>>;
}

export default function CycleComponents(props: CycleComponentsProps) {
  const { selectedGroup, setSelectedGroup, setEditCycle, setEditModal } = props;
  const theme = useTheme();
  const { components, setDetectedChanges } = useGroup();

  const parentComponents = components
    .filter((component) => component.parentId === null)
    .filter((component) => ![WARMUP_ID, COOLDOWN_ID].includes(component.id));

  return (
    <Box
      display="flex"
      width="100%"
      maxWidth="100%"
      mt={2}
      gap={1}
      sx={{
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        minWidth: 0,
        flexWrap: 'nowrap',
      }}
    >
      {selectedGroup.cycles
        .sort((a, b) => dayjs(a.from).unix() - dayjs(b.from).unix())
        .map((cycle) => (
          <Box
            key={cycle.id}
            display="flex"
            flexDirection="column"
            width={200}
            sx={{
              minWidth: '200px',
              maxWidth: '200px',
              flexShrink: 0,
            }}
          >
            {/*Header*/}
            <Box
              key="header"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              bgcolor={theme.palette.primary.main}
              sx={{
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                cursor: 'pointer',
              }}
              py={1}
              onClick={() => {
                setEditModal(true);
                setEditCycle(cycle);
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: 'background.paper',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  display: 'block',
                }}
              >
                {cycle.name.toUpperCase()}
              </Typography>

              <Typography variant="body2" sx={{ color: 'background.paper' }}>
                {dayjs(cycle.from).format('DD. MMM.').toLowerCase()} -{' '}
                {dayjs(cycle.to).format('DD. MMM.').toLowerCase()}
              </Typography>
            </Box>

            {/*Components*/}
            <Box
              key="components"
              display="flex"
              flexDirection="column"
              gap={1}
              minHeight={275}
              width="100%"
              bgcolor="background.paper"
              sx={{
                p: 0,
                px: 1,
                pt: 2,
                borderBottomLeftRadius: 10,
                borderBottomRightRadius: 10,
                overflowY: 'auto',
              }}
              alignItems="center"
            >
              {cycle.selectedTargets.map((selectedTarget, i) => {
                const { componentId, targetId } = selectedTarget;

                const component = components.find(
                  (component) => component.id === componentId
                );

                if (!component) return <></>;

                const target = component.targets?.find(
                  (target) => target.id === targetId
                );

                return (
                  <CycleComponentsSelect
                    key={i}
                    label={component.name}
                    selectedValue={target?.name || ''}
                    component={component}
                    setValue={(targetId) => {
                      setDetectedChanges(true);

                      if (targetId === 'Remove') {
                        const newCycle: Cycle = {
                          ...cycle,
                          selectedTargets: cycle.selectedTargets.filter(
                            (st) => st.componentId !== component.id
                          ),
                        };

                        const newCycles = selectedGroup.cycles.map((c) =>
                          c.id === cycle.id ? newCycle : c
                        );
                        setSelectedGroup({
                          ...selectedGroup,
                          cycles: newCycles,
                        });
                        return;
                      }

                      const newTarget = component.targets?.find(
                        (c) => c.id === targetId
                      );

                      if (!newTarget) return;

                      const newSelectedTargets = cycle.selectedTargets.some(
                        (st) => st.componentId === component.id
                      )
                        ? cycle.selectedTargets.map((st) =>
                            st.componentId === component.id
                              ? {
                                  componentId: component.id,
                                  targetId: newTarget.id,
                                }
                              : st
                          )
                        : [
                            ...cycle.selectedTargets,
                            {
                              componentId: component.id,
                              targetId: newTarget.id,
                            },
                          ];

                      const newCycle: Cycle = {
                        ...cycle,
                        selectedTargets: newSelectedTargets,
                      };

                      const newCycles = selectedGroup.cycles.map((c) =>
                        c.id === cycle.id ? newCycle : c
                      );
                      setSelectedGroup({ ...selectedGroup, cycles: newCycles });
                    }}
                  />
                );
              })}

              {cycle.selectedTargets.length < 4 && (
                <SelectInput<Component>
                  key="add-component"
                  label={'Select component'}
                  icon={null}
                  value={''}
                  items={parentComponents}
                  disableInputLabel={true}
                  itemKey="id"
                  itemName="name"
                  sx={{ width: '90%' }}
                  setValue={(value) => {
                    setDetectedChanges(true);

                    const component = components.find((c) => c.id === value);
                    if (!component) return;

                    if (
                      cycle.selectedTargets.some(
                        (st) => st.componentId === component.id
                      )
                    )
                      return toast.error('Component already added');

                    const newSelectedTargets = [
                      ...cycle.selectedTargets,
                      { componentId: component.id, targetId: '' },
                    ];

                    const newCycle: Cycle = {
                      ...cycle,
                      selectedTargets: newSelectedTargets,
                    };

                    const newCycles = selectedGroup.cycles.map((c) =>
                      c.id === cycle.id ? newCycle : c
                    );

                    setSelectedGroup({
                      ...selectedGroup,
                      cycles: newCycles,
                    });
                  }}
                />
              )}
            </Box>
          </Box>
        ))}
    </Box>
  );
}
