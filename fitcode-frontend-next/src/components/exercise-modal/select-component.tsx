import { FormControl } from '@mui/material';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import type { SelectChangeEvent } from '@mui/material/Select';
import Select from '@mui/material/Select';

import type { TreeComponent } from '@/core/component/type/component.type';
import type { SetState } from '@/lib/common/type/state.type';

interface Props {
  selectedComponents: { [key: number]: string };
  setSelectedComponents: SetState<{ [key: number]: string }>;
  components: TreeComponent[];
}

/**
 * Recursive component to show select for subcomponents. State is managed as
 * an array of selected component ids. For example, let's say user selects root
 * component 'strength', then 'upper body', then 'chest'. The state will be:
 * ```ts
 * const state = {
 *   0: 'strength',
 *   1: 'upper body',
 *   2: 'chest'
 * }
 * ```
 *
 * To convert this to an array, you can use:
 * ```ts
 * const array = Object.values(state)
 * // ['strength', 'upper body', 'chest']
 * ```
 */
export default function SelectComponent({
  selectedComponents,
  setSelectedComponents,
  components,
}: Props) {
  function onChange(event: SelectChangeEvent, level: number) {
    const selected = event.target.value as string;
    setSelectedComponents((prev) => ({ ...prev, [level]: selected }));

    // clear selections for nested levels
    for (let i = level + 1; i < Object.keys(selectedComponents).length; i++) {
      setSelectedComponents((prev) => {
        delete prev[i];
        return prev;
      });
    }
  }

  function render(nodes: TreeComponent[], level = 0) {
    if (!nodes || !nodes.length) return null;
    const current = selectedComponents[level];
    const children = nodes.find((node) => node.id === current)?.children || [];

    return (
      <Box mb={2}>
        <FormControl fullWidth>
          <Select
            value={current || ''}
            onChange={(event) => onChange(event, level)}
            fullWidth
            variant="outlined"
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>

            {nodes.map((node) => (
              <MenuItem key={node.id} value={node.id}>
                {node.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Render children recursively if a component is selected */}
        {children.length > 0 && render(children, level + 1)}
      </Box>
    );
  }

  return render(components);
}
