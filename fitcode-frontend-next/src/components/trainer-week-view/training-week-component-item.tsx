import { theme } from '@/app/style';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import { Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { UpdateTrainingInput } from './type';
import { useGroup } from '@/context/group-provider';

interface TrainerWeekComponentItemProps {
  component: TrainingComponent;
  training: Training;
  setIsChanged: (isChanged: boolean) => void;
  updatedComponents: TrainingComponent[];
  setUpdatedComponents: (components: TrainingComponent[]) => void;
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

  const { filteredTrainings, setFilteredTrainings } = useGroup();
  return (
    <Stack key={c.id}>
      <Typography
        sx={{
          color: '#fff',
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

              const updatedTrainings = [...filteredTrainings].map((t) =>
                t.id === training.id ? newTraining : t
              );

              setFilteredTrainings(updatedTrainings);
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
