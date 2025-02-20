import { CommonService } from '@/common/service/common.service';
import { useGroup } from '@/context/group-provider';
import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import SelectInput from '../select-input';
import { Component } from '@/controller/component/type/component.type';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SetState } from '@/common/type/state.type';
import { Cycle } from '@/controller/group/type/cycle.type';

const commonService = CommonService.instance;

interface CycleComponentsProps {
  setEditModal: SetState<boolean>;
  setEditCycle: React.Dispatch<React.SetStateAction<Cycle | null>>
}

export default function CycleComponents(props: CycleComponentsProps) {
  const { group, components, setGroup } = useGroup();
  const [cycles, setCycles] = useState(group.cycles);
  const parentComponents = components.filter(
    (component) => component.parent === null
  );

  useEffect(() => {
    setCycles(group.cycles);
  }, [group]);

  return (
    <Box display="flex" width="100%" mt={2} gap={1} sx={{ overflowX: 'auto' }}>
      {cycles.map((cycle) => (
        <Box display="flex" flexDirection="column">
          {/*Header*/}
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            bgcolor="#1EB980"
            sx={{
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              cursor: 'pointer',
            }}
            width={200}
            py={1}
            onClick={() => {
              props.setEditModal(true);
              props.setEditCycle(cycle);
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
            display="flex"
            flexDirection="column"
            gap={1}
            minHeight={265}
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
                (c) => c.parent === componentId
              );

              const selectedLeafComponent = leafComponents.find(
                (c) => cycle.leafComponentsIds[i] === c.id
              );

              if (!component) return <></>;

              return (
                <SelectInput<Component>
                  label={component.name}
                  icon={null}
                  value={
                    selectedLeafComponent
                      ? selectedLeafComponent.id
                      : component.id
                  }
                  items={components.filter((c) => c.parent === component.id)}
                  placeholder="Remove Component"
                  sx={{ width: '90%' }}
                  displayInputLabel={false}
                  itemKey="id"
                  useRenderValue={true}
                  itemName="name"
                  enableRemove={true}
                  setValue={(value) => {
                    if (value === 'Remove Component') {
                      const newCycle = {
                        ...cycle,
                        rootComponentsIds: cycle.rootComponentsIds.filter(
                          (cId, k) => i !== k
                        ),
                        leafComponentsIds: cycle.leafComponentsIds.filter(
                          (cId, k) => i !== k
                        ),
                      };
                      const newCycles = cycles.map((c) => {
                        if (c.id === cycle.id) return newCycle;
                        return c;
                      });
                      setCycles(newCycles);
                      setGroup({ ...group, cycles: newCycles });
                      return;
                    }
                    const component = components.find(
                      (component) => component.id === value
                    );
                    if (!component) return;

                    if (cycle.leafComponentsIds.includes(component.id)) {
                      toast.error('Component already added');
                      return;
                    }

                    const newCycle = {
                      ...cycle,
                      leafComponentsIds: [
                        ...cycle.leafComponentsIds.slice(0, i),
                        component.id,
                        ...cycle.leafComponentsIds.slice(i + 1),
                      ],
                    };

                    const newCycles = cycles.map((c) => {
                      if (c.id === cycle.id) return newCycle;
                      return c;
                    });
                    setCycles(newCycles);
                    setGroup({ ...group, cycles: newCycles });
                  }}
                />
              );
            })}

            {cycle.rootComponentsIds.length < 4 && (
              <SelectInput<Component>
                label={'Select component'}
                icon={null}
                value={cycle.id}
                items={parentComponents}
                placeholder="Select Component"
                displayInputLabel={true}
                itemKey="id"
                itemName="name"
                sx={{ width: '90%' }}
                setValue={(value) => {
                  const component = components.find(
                    (component) => component.id === value
                  );
                  if (!component) return;

                  if (cycle.rootComponentsIds.includes(component.id)) {
                    toast.error('Component already added');
                    return;
                  }

                  const newCycle = {
                    ...cycle,
                    rootComponentsIds: [
                      ...cycle.rootComponentsIds,
                      component.id,
                    ],
                  };
                  const newCycles = cycles.map((c) => {
                    if (c.id === cycle.id) return newCycle;
                    return c;
                  });
                  setCycles(newCycles);
                  setGroup({ ...group, cycles: newCycles });
                }}
              />
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
