import type { ChildrenProps } from '@/common/type/props.type';
import AnimationMinDurationGate from '@/components/animation-min-duration-gate/animation-min-duration-gate';
import InitAthleteProvider from '@/store/init-athlete-provider';

export default async function Layout({ children }: ChildrenProps) {
  return (
    <AnimationMinDurationGate minMs={3000}>
      <InitAthleteProvider>{children}</InitAthleteProvider>
    </AnimationMinDurationGate>
  );
}
