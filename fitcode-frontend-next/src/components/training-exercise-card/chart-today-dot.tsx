import { useTrainerDayView } from '@/store/trainer-day-view.provider';

type DotProps = {
  cx?: number;
  cy?: number;
  stroke?: string;
  payload?: { trainingId: string; [key: string]: unknown };
  value?: number | string | null;
};

export const TodayDot: React.FC<DotProps> = ({
  cx,
  cy,
  stroke,
  payload,
  value,
}) => {
  const { training } = useTrainerDayView();

  if (cx === null || cy === null || value === null) return null;

  const big = payload?.trainingId === training?.id;

  const r = big ? 6 : 2; // bigger dot for today
  const sw = 3;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      stroke={stroke}
      strokeWidth={sw}
      fill="#fff" // white center; change if you want solid
    />
  );
};
