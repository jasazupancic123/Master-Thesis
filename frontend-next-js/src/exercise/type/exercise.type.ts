export interface Exercise {
  id: string;
  userId: string;
  name: string;
  componentIds: string[];
  components?: string[];
  global: boolean;
  imageUrl?: string;
  videoUrl?: string;
  attributeValues: Record<string, any>;
}

export interface ExerciseAttribute {
  id: string;
  name: string;
  field: string;
  required?: boolean;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  unit?: string;
  values: (string | ExerciseAttributeSelectOption)[];
}

export interface ExerciseAttributeSelectOption {
  name: string;
  field: string;
  values: (string | ExerciseAttributeSelectOption)[];
}

export type CreateExercise = Partial<Exercise>;