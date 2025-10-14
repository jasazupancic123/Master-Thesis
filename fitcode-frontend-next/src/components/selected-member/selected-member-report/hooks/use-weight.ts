import { useEffect, useState } from 'react';

import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

export default function useSelectedMemberWeight() {
  const { wellness, selectedAthlete } = useTrainerDayViewContext();

  const [weight, setWeight] = useState<number | undefined>(
    wellness.find((w) => w.userId === selectedAthlete?.uid)?.weight
  );

  useEffect(() => {
    setWeight(wellness.find((w) => w.userId === selectedAthlete?.uid)?.weight);
  }, [selectedAthlete, wellness]);

  return {
    weight,
    setWeight,
  };
}
