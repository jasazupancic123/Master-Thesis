import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import React from 'react';

export interface TreeItem {
  id: string;
  name: string;
  children?: TreeItem[];
}

interface Props {
  data: TreeItem[];
}

export default function Tree(props: Props) {
  return (
    <SimpleTreeView expandedItems={props.data.map(item => item.id)}>
      {props.data.map((item) => (
        <TreeItem key={item.id} label={item.name} itemId={item.id}>
          {item.children && <Tree data={item.children} />}
        </TreeItem>
      ))}
    </SimpleTreeView>
  );
}