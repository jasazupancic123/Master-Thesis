import GroupInitializer from '@/initializers/group.initializer';
import { TrainerDayViewProvider } from '@/store/trainer-day-view.provider';

export default async function Layout({ children }: React.PropsWithChildren) {
  return (
    <GroupInitializer>
      <TrainerDayViewProvider>{children}</TrainerDayViewProvider>
    </GroupInitializer>
  );
}
