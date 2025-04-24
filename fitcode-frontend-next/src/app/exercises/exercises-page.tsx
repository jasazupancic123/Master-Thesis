'use client';

import FileUpload from '@/components/file-upload';
import MyModal from '@/components/modal';
import { useExerciseContext } from '@/context/exercises-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Publish } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { handleCreateManyExercises, handleCsvFileUpload } from './state';

export default function ExercisesPage() {
  const router = useRouter();
  const screenSize = useScreenSize();

  const {
    token,
    components,
    attributes,
    setAttributes,
    exercises,
    setExercises,
  } = useExerciseContext();

  const [importedExercises, setImportedExercises] = useState<Exercise[]>([]);
  const [modal, setModal] = useState({
    add: false,
    edit: false,
    import: false,
  });

  return (
    <>
      {/* Import Button */}
      <Tooltip title="Import">
        <IconButton
          onClick={() => {
            setModal({ ...modal, import: true });
          }}
        >
          <Publish />
        </IconButton>
      </Tooltip>

      {/* Import exercises modal */}
      <MyModal
        isOpen={modal.import}
        setIsOpen={(open) => setModal((prev) => ({ ...prev, import: open }))}
        width={screenSize.isMobile ? undefined : 500}
        onConfirm={() => {
          handleCreateManyExercises(
            token,
            {
              exercises: importedExercises.map((exercise) => ({
                name: exercise.name,
                componentIds: exercise.componentIds,
                imageUrl: exercise.imageUrl,
                videoUrl: exercise.videoUrl,
                instruction: exercise.instruction,
                attributeValues: exercise.attributeValues,
              })),
            },
            { router, setExercises }
          );

          setModal((prev) => ({ ...prev, import: false }));
        }}
      >
        <FileUpload
          label="Import Exercises"
          input="csv"
          onFileUpload={async (file) => {
            handleCsvFileUpload(file, { setImportedExercises });
          }}
        />
      </MyModal>
    </>
  );
}
