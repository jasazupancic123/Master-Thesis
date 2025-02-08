export type ExerciseAttribute = {
  field: string;
  name: string;
  required?: boolean;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  unit?: string;
  values: (string | ExerciseAttributeSelectOption)[];
}

export type ExerciseAttributeSelectOption = {
  name: string;
  field: string;
  values: (string | ExerciseAttributeSelectOption)[];
}