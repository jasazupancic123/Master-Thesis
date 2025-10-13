import { useRef, useState } from 'react';

export type UseFaceCaptureUtilsReturnType = ReturnType<
  typeof useFaceCaptureUtils
>;

export default function useFaceCaptureUtils() {
  const [isActive, setIsActive] = useState(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [label, setLabel] = useState('Face forward');

  const labelRef = useRef(label); // tracks last emitted label
  const isDoneRef = useRef(false);

  return {
    isActive,
    setIsActive,
    openModal,
    setOpenModal,
    streamError,
    setStreamError,
    label,
    setLabel,
    labelRef,
    isDoneRef,
  };
}
