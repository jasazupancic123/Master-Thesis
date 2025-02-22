import { COLORS } from '@/common/constant/color.constant';
import { CommonService } from '@/common/service/common.service';
import { useGroup } from '@/context/group-provider';
import { Box, Typography } from '@mui/material';
import { useEffect } from 'react';
import { TrainingCardProps } from './props';
import TrainingComponentCard from './training-component';

const commonService = CommonService.instance;

export default function TrainingCard(props: TrainingCardProps) {
  const { day, training, period } = props;
  const {
    training: selectedTraining,
    selectedSubgroup,
    setSelectedSubgroup,
    component,
    selectedAthlete,
    setSelectedAthlete,
  } = useGroup();

  useEffect(() => {
    if (!component || !selectedSubgroup || !selectedSubgroup?.subgroup) return;
    // check if subgroup is still inside the component.subgroups, cuz the selected one might get deleted
    if (
      selectedSubgroup &&
      component.subgroups.findIndex(
        (subgroup) => subgroup.id === selectedSubgroup?.subgroup?.id
      ) === -1
    ) {
      setSelectedSubgroup(null);
    }
  }, [component]);

  useEffect(() => {
    if (!selectedSubgroup?.subgroup) {
      setSelectedAthlete(undefined);
      return;
    }

    if (
      selectedSubgroup.subgroup.membersIds?.findIndex(
        (member) => member === selectedAthlete?.uid
      ) === -1
    )
      setSelectedAthlete(undefined);
  }, [training, selectedSubgroup?.subgroup]);

  return (
    <Box width="100%">
      <Box display="flex" mt={2}>
        <Box
          display="flex"
          width="wrap"
          alignItems="center"
          justifyContent="flex-start"
          sx={{
            backgroundColor: '#005D57',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}
          p={0}
        >
          <Box
            p={2}
            mr={1}
            sx={{
              backgroundColor:
                selectedSubgroup?.subgroup &&
                selectedTraining?.id === training.id
                  ? COLORS[selectedSubgroup.index % COLORS.length]
                  : 'background.paper',
              borderTopLeftRadius: 10,
            }}
          />
          <Typography variant="caption" sx={{ mx: 1 }}>
            {period}
          </Typography>

          <Typography variant="caption" sx={{ mx: 1 }}>
            {commonService.date.format(day.date)}
          </Typography>

          <Typography variant="caption" sx={{ mx: 1 }}>
            {commonService.date.formatTime(training.from)}:
            {commonService.date.formatTime(training.to)}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          border: '1px solidrgb(36, 38, 46)',
          borderRadius: 2,
          borderTopLeftRadius: 0,
          backgroundColor: 'background.paper',
          p: 1,
          mt: 0,
        }}
      >
        {training && (
          <>
            {training.components.map((trainingComponent, i) => (
              <TrainingComponentCard
                key={i}
                training={training}
                trainingComponent={trainingComponent}
              />
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
