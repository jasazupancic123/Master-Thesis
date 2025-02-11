'use client';

import { Box, Button, ToggleButtonGroup } from '@mui/material';
import { GroupIdPageProps } from './type';
import TrainerGroupSidebar from '@/components/trainer-group-sidebar';
import { FilterType } from '@/common/type/filter.type';
import FilterButton from '../../../components/filter-button';
import { ReactNode, useState } from 'react';
import TrainerYearView from '../../../components/trainer-year-view';
import MyModal from '@/components/modal';
import AddCycleModal from '@/components/add-cycle-modal';
import TrainerCycleView from '@/components/trainer-cycle-view';
import { useScreenSize } from '@/context/screen-size-provider';

export default function TrainerPage(props: GroupIdPageProps) {
  const { token, groupId, users, groups, exercises, attributes, components } =
    props;

  const [filter, setFilter] = useState<FilterType>('day');
  const [selectedGroup, setSelectedGroup] = useState(
    () => groups.find((g) => g.id === groupId)!
  );

  const mapper: Record<FilterType, ReactNode> = {
    day: 'Day',
    week: 'Week',
    cycle: <TrainerCycleView {...props} />,
    year: <TrainerYearView {...props} />,
  };

  const [modal, setModal] = useState({ add_cycle: false });
  const screenSize = useScreenSize();

  return (
    <Box
      mt="16px"
      ml={screenSize.isLandscapeMobile || screenSize.isMobile ? '0' : '45px'}
      mx={screenSize.isLandscapeMobile || screenSize.isMobile ? 1 : undefined}
      pl={!screenSize.isLandscapeMobile && !screenSize.isMobile ? 2.25 : 0}
    >
      <TrainerGroupSidebar
        groups={groups}
        selectedGroup={selectedGroup}
        logout={async () => {
          console.log('Log out');
        }}
      />
      <Box
        bgcolor="background.paper"
        sx={{
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
        }}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        {/* Date filter */}
        <Box mx="auto" justifyContent="center" mb={2}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, val: FilterType) =>
              setFilter((prev) => (!val ? prev : val))
            }
            sx={{ display: 'flex', bgcolor: '#1A2B3C', width: 300, mx: 'auto' }}
          >
            {(['day', 'week', 'cycle', 'year'] as FilterType[]).map((val) => (
              <FilterButton key={val} value={val} />
            ))}
          </ToggleButtonGroup>
        </Box>

        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2, mb: 2 }}
          onClick={() => setModal({ ...modal, add_cycle: true })}
        >
          Add Cycle
        </Button>
      </Box>

      {props.groupId && (
        <>
          {/* Group Settings modal */}
          <MyModal
            isOpen={modal.add_cycle}
            setIsOpen={(open) => setModal({ ...modal, add_cycle: open })}
            onCancel={() => setModal({ ...modal, add_cycle: false })}
            cancelText="Close"
          >
            <AddCycleModal
              token={token}
              onClose={() => setModal({ ...modal, add_cycle: false })}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
            />
          </MyModal>
        </>
      )}

      <Box>{mapper[filter]}</Box>
    </Box>
  );
}
