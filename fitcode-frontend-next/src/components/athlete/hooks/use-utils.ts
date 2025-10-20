import { useState } from 'react';

export default function useAthleteTrainingCardUtils() {
  const [modal, setModal] = useState(false);
  const [showSupersets, setShowSupersets] = useState(false);

  return {
    modal,
    setModal,
    showSupersets,
    setShowSupersets,
  };
}
