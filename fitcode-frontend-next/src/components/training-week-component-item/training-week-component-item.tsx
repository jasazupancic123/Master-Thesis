import { theme } from '@/app/style';
import { TrainingComponent } from '@/controller/training/type/training-component.type';
import { Training } from '@/controller/training/type/training.type';
import { Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useGroup } from '@/store/group-provider';
import { SetState } from '@/common/type/state.type';

interface TrainerWeekComponentItemProps {
  component: TrainingComponent;
  training: Training;
  setIsChanged: SetState<boolean>;
  updatedComponents: TrainingComponent[];
  setUpdatedComponents: SetState<TrainingComponent[]>;
  warmupOrCooldown?: 'warmup' | 'cooldown';
}

export default function TrainerWeekComponentItem(
  props: TrainerWeekComponentItemProps
) {
  const {
    component: c,
    training,
    setIsChanged,
    updatedComponents,
    setUpdatedComponents,
    warmupOrCooldown,
  } = props;

  const { setTrainings } = useGroup();
  return (
    <Stack key={c.id}>
      <Typography
        sx={{
          textAlign: 'left',
          flexBasis: '66.67%',
        }}
      >
        {c.component?.name}
      </Typography>

      <Stack spacing={1} sx={{ mb: 1 }}>
        <input
          type="time"
          value={dayjs(c.from).format('HH:mm')}
          onChange={(e) => {
            setIsChanged(true);

            const [hours, minutes] = e.target.value.split(':');
            const from = dayjs(training.from)
              .set('hour', parseInt(hours))
              .set('minute', parseInt(minutes))
              .toDate();

            if (warmupOrCooldown) {
              const wOrC =
                warmupOrCooldown === 'warmup'
                  ? { ...training.warmup }
                  : { ...training.cooldown };
              wOrC.from = from;
              wOrC.to = dayjs(from).add(5, 'minute').toDate();

              const newTraining: Training = {
                ...training,
              };

              if (warmupOrCooldown === 'warmup') newTraining.warmup = wOrC;
              else newTraining.cooldown = wOrC;

              setTrainings((prev) =>
                prev.map((t) => (t.id === newTraining.id ? newTraining : t))
              );
              return;
            }

            const components = [...updatedComponents];
            const i = updatedComponents.findIndex((tc) => tc.id === c.id);
            if (i === -1) return;
            components[i] = { ...components[i], from };
            setUpdatedComponents(components);
          }}
          style={{
            color: '#fff',
            backgroundColor: theme.palette.background.default,
            border: 'none',
            padding: '4px',
            borderRadius: '4px',
            textAlign: 'center',
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
          }}
        />
        <style jsx>{`
          input[type='time']::-webkit-calendar-picker-indicator {
            filter: invert(1);
            cursor: pointer;
          }
        `}</style>

        {/* <input
                type="time"
                value={date.to}
                onChange={(e) => onChange('to', e.target.value)}
                style={{
                  color: '#fff',
                  backgroundColor: 'background.default',
                  border: 'none',
                  padding: '4px',
                  borderRadius: '4px',
                  textAlign: 'center',
                }}
              /> */}
      </Stack>
    </Stack>
  );
}
