import { WorkloadStatus } from '@/controller/training/workload.service';
import { useMain } from '@/store/main.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

interface UseMembersProps {
  componentId: string;
}

export default function useTrainingComponentMembers(props: UseMembersProps) {
  const { users } = useMain();
  const { progress } = useTrainerDayViewContext();

  const { componentId } = props;

  const membersInProgress = progress
    .filter(
      (p) => p.id === componentId && p.status === WorkloadStatus.IN_PROGRESS
    )
    .map((p) => users.find((u) => u.uid === p.userId))
    .filter((u) => u !== undefined);

  const completedMembers = progress
    .filter(
      (p) => p.id === componentId && p.status === WorkloadStatus.COMPLETED
    )
    .map((p) => users.find((u) => u.uid === p.userId))
    .filter((u) => u !== undefined);

  return { membersInProgress, completedMembers };
}
