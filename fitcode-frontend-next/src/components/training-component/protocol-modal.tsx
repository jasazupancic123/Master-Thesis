import { Box, Button } from '@mui/material';

import SupersetsSimpleView from '../supersets/supersets-simple-view';
import type { TrainingProtocol } from '@/core/training/type/training-protocol.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import EditableTextField from '@/ui/editable-text-field';
import MyModal from '@/ui/modal';

interface Props {
  data: TrainingProtocol | null;
  setData: SetState<TrainingProtocol | null>;
  open: boolean;
  setOpen: SetState<boolean>;
  onConfirm?: (protocol: TrainingProtocol) => Promise<void>;
  onDelete?: (protocolId: string) => Promise<void>;
}

export default function ProtocolModal({
  data,
  setData,
  open,
  setOpen,
  onConfirm,
  onDelete,
}: Props) {
  const { exercises } = useMain();
  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    protocols,
    setSupersets,
  } = useTrainerDayView();

  if (!training || !component) return null;

  function replaceSupersets() {
    if (!data || !component) return;

    const supersets = structuredClone(data.supersets);
    for (const s of supersets)
      s.exercises.map((e) => {
        e.exercise = exercises.find((ex) => ex.id === e.id);
      });

    setSupersets(supersets);

    const updatedComponent = selectedSubgroup
      ? {
          ...component,
          subgroups: component.subgroups.map((sg) => {
            if (sg.id === selectedSubgroup.id) {
              return { ...sg, supersets };
            }
            return sg;
          }),
        }
      : { ...component, supersets };

    if (selectedSubgroup)
      setSelectedSubgroup({ ...selectedSubgroup, supersets });

    setComponent(updatedComponent);
    setTraining((prev) =>
      !prev
        ? prev
        : {
            ...prev,
            components: prev.components.map((c) => {
              if (c.id === updatedComponent.id) return updatedComponent;
              return c;
            }),
          }
    );

    setData(null); // close modal
  }

  const exists = protocols.find((p) => p.id === data?.id);

  return (
    <Box>
      <MyModal
        isOpen={open}
        setIsOpen={setOpen}
        confirmText={exists ? 'Update' : 'Create'}
        onDelete={() => (data ? onDelete?.(data.id) : Promise.resolve())}
        onConfirm={async () => {
          if (data) await onConfirm?.(data);
        }}
        customTitleComponent={
          <EditableTextField
            sx={{ p: 1.5, mx: 1.5 }}
            value={data?.name || ''}
            onFocusOutSave
            onChange={(newValue) => {
              const newData = data ? { ...data, name: newValue } : null;
              setData(newData);
            }}
          />
        }
        additionalDialogue={
          exists && (
            <Button
              variant="contained"
              sx={{ m: 1 }}
              onClick={() => replaceSupersets()}
            >
              Use
            </Button>
          )
        }
      >
        <Box my={2}>
          <SupersetsSimpleView
            supersets={
              data?.supersets
                ? data.supersets
                : selectedSubgroup
                  ? selectedSubgroup.supersets
                  : component.supersets
            }
          />
        </Box>
      </MyModal>
    </Box>
  );
}
