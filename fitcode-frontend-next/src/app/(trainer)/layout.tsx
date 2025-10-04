// app/(coach)/layout.tsx
import AnimationMinDurationGate from '@/components/animation-min-duration-gate/animation-min-duration-gate';
import InitTrainerProvider from '@/store/init-trainer-provider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AnimationMinDurationGate>
      <InitTrainerProvider>{children}</InitTrainerProvider>
    </AnimationMinDurationGate>
  );
}
