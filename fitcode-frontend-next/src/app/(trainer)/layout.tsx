import AnimationMinDurationGate from '@/components/animation-min-duration-gate/animation-min-duration-gate';
import { CoachTrainingHeaderProvider } from '@/store/coach-training-header.provider';
import InitTrainerProvider from '@/store/init-trainer-provider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AnimationMinDurationGate>
      <CoachTrainingHeaderProvider>
        <InitTrainerProvider>{children}</InitTrainerProvider>
      </CoachTrainingHeaderProvider>
    </AnimationMinDurationGate>
  );
}
