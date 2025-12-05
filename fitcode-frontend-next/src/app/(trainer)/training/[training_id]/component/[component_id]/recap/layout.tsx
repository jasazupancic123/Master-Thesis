import TrainingRecapInitializer from '@/initializers/training-recap.initializer';

export default function Layout({ children }: React.PropsWithChildren) {
  return <TrainingRecapInitializer>{children}</TrainingRecapInitializer>;
}
