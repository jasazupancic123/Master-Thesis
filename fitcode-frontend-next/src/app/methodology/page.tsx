import MethodsDataGrid from '@/components/methodology/methods-data-grid';
import { Methods } from '@/core/exercise/constant/method.constant';

export default function Page() {
  return <MethodsDataGrid items={Methods} />;
}
