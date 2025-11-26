import Papa from 'papaparse';
import { useState } from 'react';
import toast from 'react-hot-toast';

import type { ImportWorkload } from '@/core/training/type/workload.type';
import { InputType } from '@/lib/common/const/input-type.const';
import { useScreenSize } from '@/store/screen-size.provider';
import FileUpload from '@/ui/file-upload';
import MyModal from '@/ui/modal';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  importWorkloads: (workloads: ImportWorkload[]) => Promise<void>;
};

export default function ImportWorkloadsModal({
  open,
  setOpen,
  importWorkloads,
}: Props) {
  const screenSize = useScreenSize();
  const isSmallSize = screenSize.isMobile || screenSize.isTablet;
  const [workloads, setWorkloads] = useState<ImportWorkload[]>([]);

  return (
    <MyModal
      isOpen={open}
      setIsOpen={setOpen}
      width={isSmallSize ? undefined : 500}
      onConfirm={async () => {
        await importWorkloads(workloads);
        setWorkloads([]);
        setOpen(false);
      }}
    >
      <FileUpload
        label="workloads"
        input={InputType.CSV}
        onFileUpload={async (file) => {
          Papa.parse<ImportWorkload>(file, {
            header: true,
            skipEmptyLines: true,
            error: (e: Error) =>
              toast.error(`Failed to parse CSV file: ${e.message}`),
            transform: (value, column) => {
              switch (column) {
                case 'email':
                case 'exerciseId':
                  // trim
                  return value.trim();
                case 'date':
                  return new Date(value);
                default:
                  return +value;
              }
            },
            complete: ({ data }) => {
              setWorkloads(data);
            },
          });
        }}
      />
    </MyModal>
  );
}
