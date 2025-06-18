'use client';

import { DASHBOARD_MAIN } from '@/common/constant/dashboard-views-constant';
import DashboardPage from '@/sites/dashboard.page';

export default function Page() {
  return <DashboardPage view={DASHBOARD_MAIN} />;
}
