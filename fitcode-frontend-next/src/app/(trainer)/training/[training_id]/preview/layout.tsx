import { TrainingPreviewProvider } from '@/store/training-preview.provider';

export default function Layout({ children }: React.PropsWithChildren) {
  return <TrainingPreviewProvider>{children}</TrainingPreviewProvider>;
}
