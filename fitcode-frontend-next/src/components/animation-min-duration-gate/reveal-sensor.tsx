import { useEffect } from 'react';

interface Props extends React.PropsWithChildren {
  onReveal: () => void;
}

// Fires once its children actually mount (i.e., when Suspense reveals)
export function RevealSensor({ onReveal, children }: Props) {
  useEffect(() => onReveal(), [onReveal]);
  return <>{children}</>;
}
