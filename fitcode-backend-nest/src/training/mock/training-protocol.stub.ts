import slugify from 'slugify';

import type { TrainingProtocol } from '../entity/training-protocol.entity';

export function generateTrainingProtocolStub(
  data?: Partial<TrainingProtocol>,
): TrainingProtocol {
  const name = data?.name || 'Protocol 1';
  const id = slugify(name, { lower: true });

  return {
    institutionId: data?.institutionId,
    id: data?.id || id,
    name,
    componentId: data?.componentId || 'c1',
    supersets: [],
    description: data?.description,
  };
}
