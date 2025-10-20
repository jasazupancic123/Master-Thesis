import { Box, Divider, Typography } from '@mui/material';

import type { SetState } from '@/lib/common/type/state.type';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import AttributeFilter from '@/util/attribute-filter/attribute-filter';
import { SearchBar } from '@/util/search-bar/search-bar';

interface RenderAttributeFilterProps {
  attribute: Attribute<Exercise>;
  search: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: Partial<Record<string, any>>;
  setSearch: SetState<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleFilterChange: (field: string, value: any) => void;
}

export default function renderAttributeFilter(
  props: RenderAttributeFilterProps
) {
  const { attribute, search, filters, setSearch, handleFilterChange } = props;

  if (!attribute) return null;

  return (
    <Box key={attribute.field} mb={2}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {attribute.name}
      </Typography>

      {attribute.searchBar && (
        <Box
          sx={{
            py: 1,
            width: '50%',
            minWidth: 240,
            maxWidth: 400,
          }}
        >
          <SearchBar
            placeholder="Search Equipment"
            value={search}
            handleSearchChange={(e) => setSearch(e.target.value)}
            maxWidth="100%"
          />
        </Box>
      )}

      <AttributeFilter
        attribute={attribute}
        value={filters[attribute.field]}
        onChange={(val) => handleFilterChange(attribute.field, val)}
        search={search}
      />

      <Divider sx={{ mt: 2 }} />
    </Box>
  );
}
