'use client';

import React, { useState } from 'react';
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import toast from 'react-hot-toast';
import Button from '@mui/material/Button';
import MyModal from '@/components/modal/modal';
import { TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tree, { TreeItem } from '@/components/tree/tree';
import { CommonService } from '@/common/service/common.service';
import {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';

const DEFAULT_COMPONENT: Component = {
  id: '',
  slug: '',
  name: '',
  parentId: null,
  children: [],
  parents: [],
};

export default function Page() {
  const components: Component[] = [];
  const componentsTree = CommonService.instance.tree.fromArray(components, {
    idPropertyName: 'id',
    parentIdPropertyName: 'parentId',
    childrenPropertyName: 'children',
  }) as unknown as TreeComponent[];

  // state
  const [component, setComponent] = useState(DEFAULT_COMPONENT);
  const [modal, setModal] = useState({ edit: false });
  const [isTreeView, setIsTreeView] = useState(false);

  async function editComponent(id: string) {
    try {
      // await ComponentController.update(token, id, component);
      toast.success('Successfully edited components');
      setModal((prev) => ({ ...prev, edit: false }));
    } catch (e) {
      toast.error('Failed to edit components');
    }
  }

  const columns: GridColDef<Component>[] = [
    { field: 'name', headerName: 'Name', width: 150 },
    {
      field: 'parentName',
      headerName: 'Parent',
      width: 150,
      valueGetter: (_, row: Component) => {
        const found = components.find(
          (component) => component.id === row.parentId
        );
        return (found || DEFAULT_COMPONENT).name;
      },
      valueSetter: (params) => params.value,
    },
    {
      field: 'actions',
      type: 'actions',
      width: 100,
      getActions: ({ id }) => {
        return [
          <GridActionsCellItem
            key={0}
            icon={<EditIcon />}
            label="Edit"
            onClick={() => {
              const found = components.find((component) => component.id === id);
              setComponent(found || DEFAULT_COMPONENT);
              setModal((prev) => ({ ...prev, edit: true }));
            }}
          />,
        ];
      },
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between">
        <Button color="secondary" onClick={() => setIsTreeView(!isTreeView)}>
          {isTreeView ? '📁 Show Table' : '🌳 Show Tree'}
        </Button>
      </Box>

      {isTreeView && componentsTree.length > 0 ? (
        <Tree data={componentsTree as TreeItem[]} />
      ) : components ? (
        <Box height={600}>
          <DataGrid rows={components} columns={columns} rowSelection={false} />
        </Box>
      ) : (
        <Typography>Loading...</Typography>
      )}

      <Box mt={10} />

      {/* Edit Modal */}
      <MyModal
        isOpen={modal.edit}
        setIsOpen={() => setModal((prev) => ({ ...prev, edit: false }))}
        actions={
          <>
            <Button
              onClick={() => editComponent(component.id as string)}
              color="primary"
            >
              Edit
            </Button>
            <Button
              onClick={() => setModal((prev) => ({ ...prev, edit: false }))}
              color="secondary"
            >
              Cancel
            </Button>
          </>
        }
      >
        <Typography variant="h5">Edit Component</Typography>

        <Box
          component="form"
          sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
          noValidate
          autoComplete="off"
          mt={2}
        >
          <TextField
            id="outlined-basic"
            label="Name"
            variant="outlined"
            value={component.name}
            onChange={(e) =>
              setComponent({ ...component, name: e.target.value })
            }
          />

          {/*<SelectData<Component>
            data={componentsTree}
            dataKeyProp="id"
            dataValueProp="name"
            label="Parent"
            value={component.parent || ''}
            onChange={(parent) => setComponent({ ...component, parent })}
          />*/}
        </Box>
      </MyModal>
    </Box>
  );
}
