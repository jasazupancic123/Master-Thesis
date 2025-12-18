import MethodsDataGrid from '@/components/dashboard/dashboard-methodology';
import { Methods } from '@/core/exercise/constant/method.constant';

export default function Page() {
  return <MethodsDataGrid items={Methods} />;
}
