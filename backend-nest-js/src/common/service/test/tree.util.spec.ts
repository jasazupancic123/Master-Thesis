import { TreeUtil } from '../util';

describe('TreeUtil::Unit', () => {
  const treeUtil = new TreeUtil();

  const items: { id: number, parentId: number | null, children?: any }[] = [
    { id: 1, parentId: null },
    { id: 2, parentId: 1 },
    { id: 3, parentId: 1 },
    { id: 4, parentId: 2 },
    { id: 5, parentId: 2 },
    { id: 6, parentId: 3 },
  ];

  it('should create a tree from an array', () => {
    const tree = treeUtil.fromArray(items, {
      idPropertyName: 'id',
      parentIdPropertyName: 'parentId',
      childrenPropertyName: 'children',
    });

    // 1
    // ├── 2
    // │   ├── 4
    // │   └── 5
    // └── 3
    //     └── 6

    expect(tree).toEqual([
      {
        id: 1,
        parentId: null,
        children: [
          {
            id: 2,
            parentId: 1,
            children: [
              { id: 4, parentId: 2, children: [] },
              { id: 5, parentId: 2, children: [] },
            ],
          },
          {
            id: 3,
            parentId: 1,
            children: [
              { id: 6, parentId: 3, children: [] },
            ],
          },
        ],
      },
    ]);
  });

  it('should loop through all items in a tree', () => {
    const result: number[] = [];
    const tree = treeUtil.fromArray(items, {
      idPropertyName: 'id',
      parentIdPropertyName: 'parentId',
      childrenPropertyName: 'children',
    });

    treeUtil.forEach(tree, 'children', (item, parent, previousResult) => {
      result.push(item.id);
      return previousResult;
    });

    expect(result).toEqual([1, 2, 4, 5, 3, 6]);
  });

  it('should return all leaf nodes in a tree and array of all their parents', () => {
    const tree = treeUtil.fromArray(items, {
      idPropertyName: 'id',
      parentIdPropertyName: 'parentId',
      childrenPropertyName: 'children',
    });

    const leafs = treeUtil.leafs(tree, 'children');

    // 4, 5, 6
    expect(leafs).toEqual([
      {
        id: 4,
        parentId: 2,
        children: [],
        parents: expect.arrayContaining([expect.objectContaining({ id: 2 }), expect.objectContaining({ id: 1 })]),
      },
      {
        id: 5,
        parentId: 2,
        children: [],
        parents: expect.arrayContaining([expect.objectContaining({ id: 2 }), expect.objectContaining({ id: 1 })]),
      },
      {
        id: 6,
        parentId: 3,
        children: [],
        parents: expect.arrayContaining([expect.objectContaining({ id: 3 }), expect.objectContaining({ id: 1 })]),
      },
    ]);
  });
});