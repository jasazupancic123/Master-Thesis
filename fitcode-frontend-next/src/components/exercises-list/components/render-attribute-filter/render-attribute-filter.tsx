import { SetState } from '@/common/type/state.type';
import AttributeFilter from '@/components/athlete/attribute-filter/attribute-filter';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { SearchBar } from '@/util/search-bar/search-bar';
import { Box, Typography, Divider } from '@mui/material';

interface RenderAttributeFilterProps {
  attribute: Attribute<Exercise>;
  search: string;
  filters: Partial<Record<string, any>>;
  setSearch: SetState<string>;
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
