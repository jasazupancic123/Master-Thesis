import { SetState } from '@/common/type/state.type';
import { useGroup } from '@/context/group-provider';
import { Component } from '@/controller/component/type/component.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SelectInput from '../select-input';
import CycleComponentsSelect from './cycle-components-select';
import { useTheme } from '@mui/material';

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

  const [cycles, setCycles] = useState(
    selectedGroup.cycles.sort(
      (a, b) => dayjs(a.from).unix() - dayjs(b.from).unix()
    )
  );

  useEffect(() => {
    setCycles(
      selectedGroup.cycles.sort(
        (a, b) => dayjs(a.from).unix() - dayjs(b.from).unix()
      )
    );
  }, [selectedGroup]);

  const parentComponents = components.filter(
    (component) => component.parentId === null
  );

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
      {cycles &&
        cycles.map((cycle) => (
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
              key={cycle.id}
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
              {cycle.rootComponentsIds.map((componentId, i) => {
                const component = components.find(
                  (component) => component.id === componentId
                );

                const leafComponents = components.filter(
                  (c) => c.parentId === componentId
                );

                const selectedLeafComponent = leafComponents.find(
                  (c) => cycle.leafComponentsIds[i] === c.id
                );

                if (!component) return <></>;

                return (
                  <CycleComponentsSelect
                    key={i}
                    label={component.name}
                    selectedValue={
                      components.find(
                        (c) => c.id === cycle.leafComponentsIds[i]
                      )?.name || ''
                    }
                    components={components}
                    parentId={component.id}
                    setValue={(value) => {
                      setDetectedChanges(true);

                      if (value === 'Remove Component') {
                        const newCycle = {
                          ...cycle,
                          rootComponentsIds: cycle.rootComponentsIds.filter(
                            (_, k) => i !== k
                          ),
                          leafComponentsIds: cycle.leafComponentsIds.filter(
                            (_, k) => i !== k
                          ),
                        };

                        const newCycles = cycles.map((c) =>
                          c.id === cycle.id ? newCycle : c
                        );
                        setCycles(newCycles);
                        setSelectedGroup({
                          ...selectedGroup,
                          cycles: newCycles,
                        });
                        return;
                      }

                      const newComponent = components.find(
                        (c) => c.id === value
                      );
                      if (!newComponent) return;

                      if (cycle.leafComponentsIds.includes(newComponent.id))
                        return toast.error('Component already added');

                      const isNewComponentAParent = components.some(
                        (c) => c.parentId === newComponent.id
                      );
                      let newCycle = { ...cycle };

                      if (isNewComponentAParent) {
                        // It's a new root component
                        newCycle.rootComponentsIds[i] = newComponent.id;

                        // If the new root has no children, ensure `leafComponentsIds` gets `""`
                        if (
                          !components.some(
                            (c) => c.parentId === newComponent.id
                          )
                        ) {
                          newCycle.leafComponentsIds[i] = '';
                        }
                      } else {
                        // It's a leaf component
                        newCycle.leafComponentsIds[i] = newComponent.id;
                      }

                      // 🔹 **Ensure `leafComponentsIds` is the same length as `rootComponentsIds`**
                      newCycle.leafComponentsIds =
                        newCycle.rootComponentsIds.map((rootId, idx) => {
                          return newCycle.leafComponentsIds[idx] || ''; // Fill empty slots with ""
                        });

                      const newCycles = cycles.map((c) =>
                        c.id === cycle.id ? newCycle : c
                      );
                      setCycles(newCycles);
                      setSelectedGroup({ ...selectedGroup, cycles: newCycles });
                    }}
                  />
                );
              })}

              {cycle.rootComponentsIds.length < 4 && (
                <SelectInput<Component>
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

                    if (cycle.rootComponentsIds.includes(component.id))
                      return toast.error('Component already added');

                    const newCycle = {
                      ...cycle,
                      rootComponentsIds: [
                        ...cycle.rootComponentsIds,
                        component.id,
                      ],
                    };

                    const newCycles = cycles.map((c) =>
                      c.id === cycle.id ? newCycle : c
                    );

                    setCycles(newCycles);
                    setSelectedGroup({
                      ...selectedGroup,
                      cycles: [...newCycles],
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
