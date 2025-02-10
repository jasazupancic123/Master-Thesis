import { ChildrenProps } from '@/common/type/props.type';

export type AppPageProps = ChildrenProps & {
  title: string;
  description: string;
  id: string;
};
