import { ConfigService } from '@nestjs/config';

import { CommonService } from '@src/common/service/common.service';
import type { Environment } from '@src/config/environment-validation-schema';

export function setupConfig() {
  const common = new CommonService();
  const config = new ConfigService<Environment>();
  return { common, config };
}
