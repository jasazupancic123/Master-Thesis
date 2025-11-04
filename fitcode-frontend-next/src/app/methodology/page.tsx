import MethodsDataGrid from '@/components/methods/methods-data-grid';
import { Methods } from '@/core/exercise/constant/method.constant';

export default function Page() {
  return <MethodsDataGrid items={Methods} />;
}
