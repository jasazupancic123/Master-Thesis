import { AfterSet } from '@/controller/component/type/after-set.type';
import { PeriodizationType } from '@/controller/training/enum/periodization-type.enum';
import { useState } from 'react';

export type UseComponentHeaderUtilsReturnType = ReturnType<
  typeof useComponentHeaderUtils
>;

export default function useComponentHeaderUtils() {
  const [afterSet, setAfterSet] = useState<AfterSet | null>();
  const [selectedPeriodizationType, setSelectedPeriodizationType] =
    useState<PeriodizationType | null>(null);
  const [numTrainingsWithSameTarget, setNumTrainingsWithSameTarget] =
    useState(0);
  const [openModal, setOpenModal] = useState(false);

  return {
    afterSet,
    setAfterSet,
    selectedPeriodizationType,
    setSelectedPeriodizationType,
    numTrainingsWithSameTarget,
    setNumTrainingsWithSameTarget,
    openModal,
    setOpenModal,
  };
}
