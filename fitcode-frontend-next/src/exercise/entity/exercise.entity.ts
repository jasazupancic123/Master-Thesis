import { IdEntity } from '@/common/entity/id.entity';
import { TimestampEntity } from '@/common/entity/timestamp.entity';
import { Component } from '@/component/entity/component.entity';
import { ExerciseAttributeValue } from '@/exercise/entity/exercise-attribute-value.entity';

export type Exercise = IdEntity &
  TimestampEntity & {
    userId: string;
    name: string;
    componentsIds: string[];
    components: Component[];
    global: boolean;
    imageUrl?: string;
    videoUrl?: string;
    values: ExerciseAttributeValue[];
    attributeValues: Record<string, any>;
  };
