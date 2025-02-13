import { CommonService } from '@/common/service/common.service';
import { FirebaseStorageUtil } from '@/common/service/util/firebase-storage.util';
import { SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import { ExerciseAttribute } from '@/controller/exercise/type/exercise-attribute.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import toast from 'react-hot-toast';

const commonService = CommonService.instance;

export async function onFileUpload(file: File, path: string) {
  try {
    await FirebaseStorageUtil.uploadFile(file, path);
  } catch (e: any) {
    console.error(e);
    toast.error(e.message || 'An error occurred');
  }
}

export async function fetchExercises(
  setFilteredExercises: SetState<Exercise[]>,
  components: Component[],
  exercises: Exercise[],
  pagination: { page: number; pageSize: number; pages: number; total: number },
  setPagination: SetState<{
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  }>,
  selectedComponent: Component | null,
  name?: string
) {
  const filter = {
    ...(selectedComponent?.id && {
      componentsIds: [selectedComponent?.id || ''],
    }),
    ...(name && { name }),
  };

  let filtered = ExerciseService.filter(exercises, filter, components);

  const total = filtered.length;

  // paginate
  const pages = Math.ceil(total / pagination.pageSize);
  const page = pages < pagination.pages ? 1 : pagination.page;
  filtered = commonService.generic.paginate(filtered, {
    page,
    pageSize: pagination.pageSize,
    orderBy: { field: 'name', value: 'asc' },
  });

  // populate exercises
  filtered.map((exercise) => {
    ExerciseService.mapAttributes(exercise);
    ExerciseService.mapComponents(exercise, components);
  });

  setFilteredExercises(filtered);
  setPagination((prev) => ({ ...prev, page, total, pages }));
}

export async function addExercise(
  token: string,
  item: Partial<Exercise>,
  selectedComponent: Component | null,
  filteredExercises: Exercise[],
  setFilteredExercises: SetState<Exercise[]>,
  setExercises: SetState<Exercise[]>,
  attributes: ExerciseAttribute[],
  components: Component[]
) {
  if (!item.name) return toast.error('Name is required');
  if (!item.componentsIds?.length)
    return toast.error('Select at least one component to add');

  try {
    const attributeValues: Record<string, any> = {};

    // find all nested select attributes and convert them to a multi-level object
    const nestedSelectAttributes = attributes
      .filter(
        (attribute) =>
          attribute.type === 'select' &&
          typeof attribute.values?.[0] === 'object'
      )
      .map((attribute) => attribute.field);

    for (const key of nestedSelectAttributes) {
      const nested = commonService.object.nestObject(
        item.attributeValues || {},
        key
      );

      if (nested) attributeValues[key] = nested;
    }

    // add all other attributes
    const otherAttributes = attributes.filter(
      (attribute) => !nestedSelectAttributes.includes(attribute.field)
    );

    for (const attribute of otherAttributes)
      attributeValues[attribute.field] =
        item.attributeValues?.[attribute.field];

    // delete all keys with undefined values
    Object.keys(attributeValues).forEach(
      (key) => attributeValues[key] === undefined && delete attributeValues[key]
    );

    const response = await ExerciseController.create(token, {
      name: item.name,
      componentsIds: item.componentsIds,
      imageUrl: item.imageUrl,
      videoUrl: item.videoUrl,
      attributeValues,
    });

    toast.success('Exercise added');

    const id = response.id;
    const rootComponents = item.componentsIds.map((cId) => {
      const component = components.find((c) => c.id === cId)!;
      return commonService.tree.getRoot(component, components);
    });

    if (
      !selectedComponent ||
      (selectedComponent &&
        rootComponents.map((c) => c.id).includes(selectedComponent.id))
    )
      setFilteredExercises([...filteredExercises, { ...item, id } as Exercise]);

    setExercises((prev) => [...prev!, { ...item, id } as Exercise]);
  } catch (e: any) {
    console.error(e);
    toast.error(e.message || 'An error occurred');
  }
}
