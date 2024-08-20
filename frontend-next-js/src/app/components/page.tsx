'use client';

import withAuth from '@/hoc/with-auth';
import React, { useState } from 'react';
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import { Component } from '@/type/component.type';
import EditIcon from '@mui/icons-material/Edit';
import { AuthContextType, useAuth } from '@/context/auth-provider';
import { UserRole } from '@/enum/user-role.enum';
import toast from 'react-hot-toast';
import Button from '@mui/material/Button';
import MyModal from '@/component/modal';
import { TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tree, { TreeItem } from '@/component/tree';
import { AppContextType, useAppContext } from '@/context/app-provider';
import SelectData from '@/component/select-data';
import { FitcodeApi } from '@/util/api';

function Page() {
  // app global context
  const { token, components } = useAppContext() as AppContextType;

  // auth context
  const { role } = useAuth() as AuthContextType;
  const isAdmin = role.includes(UserRole.ADMIN);

  // component being modified
  const [component, setComponent] = useState<Partial<Component>>({});

  // modal states
  const [modal, setModal] = useState({ edit: false });

  // view state
  const [isTreeView, setIsTreeView] = useState(false);

  /**
   * Edit component
   */
  async function editComponent(id: string) {
    try {
      await FitcodeApi.editComponent(id, token, component);
      toast.success('Successfully edited component');
      setModal(prev => ({ ...prev, edit: false }));
    } catch (e) {
      toast.error('Failed to edit component');
    }
  }

  const columns: GridColDef<Component[number]>[] = [
    { field: 'name', headerName: 'Name', width: 150 },
    {
      field: 'parentName',
      headerName: 'Parent',
      width: 150,
      valueGetter: (_, row: Component) => (components.flat.find((component: Component) => component.id === row.parentId) || { name: '' }).name,
      valueSetter: (params) => params.value,
    },
    {
      field: 'actions',
      type: 'actions',
      width: 100,
      getActions: ({ id }) => {
        return [
          <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => {
            setComponent(components.flat.find((component: Component) => component.id === id));
            setModal(prev => ({ ...prev, edit: true }));
          }} />,
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

      {isTreeView && components.tree.length > 0
        ? <Tree data={components.tree as TreeItem[]} />
        : components.flat ?
          <Box height={600}>
            <DataGrid
              rows={components.flat}
              columns={columns}
              rowSelection={false}
            />
          </Box>
          : <Typography>Loading...</Typography>
      }

      <Box mt={10} />

      {/* Edit Modal */}
      <MyModal
        isOpen={modal.edit}
        setIsOpen={() => setModal(prev => ({ ...prev, edit: false }))}
        actions={<>
          <Button onClick={() => editComponent(component.id as string)} color="primary">Edit</Button>
          <Button onClick={() => setModal(prev => ({ ...prev, edit: false }))} color="secondary">Cancel</Button>
        </>}
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
            onChange={(e) => setComponent({ ...component, name: e.target.value })}
          />

          <SelectData<Component>
            data={components.tree}
            dataKeyProp="id"
            dataValueProp="name"
            label="Parent"
            value={component.parentId || ''}
            onChange={(parentId) => setComponent({ ...component, parentId })}
          />
        </Box>
      </MyModal>
    </Box>
  );
}

export default withAuth(Page, [UserRole.ADMIN]);