import { Box, TextField, Typography } from '@mui/material';
import { Component } from '@/controller/component/type/component.type';
import { theme } from '@/app/style';
import { AddTrainingModalProps } from './type';
import { CommonService } from '@/common/service/common.service';

const commonService = CommonService.instance;

export default function AddTrainingModal(props: AddTrainingModalProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      p={2}
      alignItems="center"
      width="100%"
    >
      <Typography variant="h6">Pick Components</Typography>
      <Box display="flex" justifyContent="center" alignItems="center" mt={1}>
        {props.components.map((component, index) => {
          const IconComponent = commonService.navigation.getComponentIcon(
            component.name
          );

          return (
            <Box
              key={index}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              sx={{
                color: props.selectedComponents.find(
                  (c) => c.name === component.name
                )
                  ? theme.palette.primary.main
                  : undefined,
                boxShadow: props.selectedComponents.find(
                  (c) => c.name === component.name
                )
                  ? `1px solid ${theme.palette.primary.main}`
                  : undefined,
                borderRadius: '10px',
                cursor: 'pointer',
              }}
              mx={1}
              onClick={() => {
                const isSelected = props.selectedComponents.some(
                  (c) => c.name === component.name
                );

                if (isSelected)
                  props.setSelectedComponents(
                    props.selectedComponents.filter(
                      (c) => c.name !== component.name
                    )
                  );
                else
                  props.setSelectedComponents([
                    ...props.selectedComponents,
                    component as Component,
                  ]);
              }}
            >
              <IconComponent fontSize="large" sx={{ m: 3, mt: 1, mb: 1 }} />

              <Typography variant="caption">{component.name}</Typography>
            </Box>
          );
        })}
      </Box>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Set Time
      </Typography>

      <Box display="flex" mt={1}>
        <TextField
          label="Start Time"
          type="time"
          fullWidth
          value={props.startTime}
          onChange={(e) => props.setStartTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ m: 1 }}
        />

        <TextField
          label="End Time"
          type="time"
          fullWidth
          value={props.endTime}
          onChange={(e) => props.setEndTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ m: 1 }}
        />
      </Box>
    </Box>
  );
}
