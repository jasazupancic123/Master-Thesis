import { TrainingInProgressUtilsProvider } from '@/components/training-in-progress/context/training-in.progress-utils.provider';
import { TrainingInProgressProvider } from '@/store/training-in-progress.provider';

export default async function Layout({ children }: React.PropsWithChildren) {
  return (
    <TrainingInProgressProvider>
      <TrainingInProgressUtilsProvider>
        {children}
      </TrainingInProgressUtilsProvider>
    </TrainingInProgressProvider>
  );
}
