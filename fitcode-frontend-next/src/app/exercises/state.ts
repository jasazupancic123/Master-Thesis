import { SetState, handleApiRequest } from '@/common/type/state.type';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

export async function handleCsvFileUpload(
  file: File,
  state: { setImportedExercises: SetState<Exercise[]> }
) {
  const { setImportedExercises } = state;

  const text = await file.text();
  const rows = text.split('\n').filter((row) => row);

  const importedExercises: Exercise[] = rows.map((row, i) => {
    const [name, componentSlug, videoUrl, imageUrl] = row.split(',');
    return {
      name,
      componentsIds: [componentSlug],
      videoUrl,
      imageUrl,
      id: i.toString(),
      userId: '',
      global: false,
      values: [],
      attributeValues: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  setImportedExercises(importedExercises);
}

export async function handleCreateManyExercises(
  token: string,
  input: Parameters<typeof ExerciseController.createMany>[1],
  state: {
    router: AppRouterInstance;
    setExercises: SetState<Exercise[]>;
  }
) {
  const { router, setExercises } = state;

  handleApiRequest(
    router,
    () => ExerciseController.createMany(token, input),
    (exercises) => {
      setExercises((prev) => [...prev, ...exercises]);
      toast.success('Successfully imported exercises!');
    },
    undefined,
    'Failed to import exercises'
  );
}
