import { useRef, useState } from 'react';

export default function useAthleteExerciseReportMenu() {
  const [openSelectAthleteMenu, setOpenSelectAthleteMenu] = useState(false);
  const [openSelectExerciseMenu, setOpenSelectExerciseMenu] = useState(false);

  const athleteAnchorElRef = useRef<HTMLElement | null>(null);
  const exerciseAnchorElRef = useRef<HTMLElement | null>(null);

  return {
    openSelectAthleteMenu,
    setOpenSelectAthleteMenu,
    openSelectExerciseMenu,
    setOpenSelectExerciseMenu,
    athleteAnchorElRef,
    exerciseAnchorElRef,
  };
}
