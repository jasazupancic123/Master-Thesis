import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import React from 'react';
import Box from '@mui/material/Box';

export interface TreeItem {
  id: string;
  name: string;
  children?: TreeItem[];
}

export default function Tree({data}: { data: TreeItem[] }) {
  return (
    <SimpleTreeView expandedItems={data.map(item => item.id)}>
      {data.map((item) => (
        <TreeItem key={item.id} label={item.name} itemId={item.id} >
          {item.children && <Tree data={item.children} />}
        </TreeItem>
      ))}
    </SimpleTreeView>
  )
}