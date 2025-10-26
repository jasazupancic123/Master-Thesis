import { useEffect, useState } from 'react';

import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export default function useSelectedMemberWeight() {
  const { wellness, selectedAthlete } = useTrainerDayView();

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
