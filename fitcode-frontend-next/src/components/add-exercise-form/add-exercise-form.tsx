import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Box, Button, Pagination, Typography } from '@mui/material';

import ExerciseChips from '../exercise-chips/exercise-chips';
import ExerciseFilter from '../exercises-list/exercise-filter';
import ExercisesList from '../exercises-list/exercises-list';
import type { AddExerciseFormProps } from '../trainer-group-day-view/props/props';
import useComponentFilter from './hooks/use-component-filter';
import useExerciseFormFilters from './hooks/use-filters';
import SelectedExercisesList from './selected-exercises-list';
import { theme } from '@/app/style';
import { Components } from '@/core/exercise/constant/components.constant';
import type { Component } from '@/core/exercise/type/component.type';
import { lib } from '@/lib';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import MenuItemsList from '@/ui/menu-items-list';
import { SearchBar } from '@/ui/search-bar/search-bar';

export default function AddExerciseForm(props: AddExerciseFormProps) {
  const {
    selectedExerciseIds,
    setSelectedExerciseIds,
    newAddedExercisesIds,
    setNewAddedExercisesIds,
    component,
    handleAddExercises,
  } = props;

  const screenSize = useScreenSize();
  const { pagination, setPagination } = useTrainerDayView();

  const {
    selectedComponent,
    setSelectedComponent,
    selectedComponentsIds,
    setSelectedComponentsIds,
    selectedRootComponentId,
    anchorElLeaf,
    openLeafMenu,
    handleCloseLeaf,
    leafComponents,
    handleClickLeaf,
    computeWholeComponentId,
    computeWholeTree,
  } = useComponentFilter();

  const {
    filters,
    setFilters,
    openFilters,
    setOpenFilters,
    filteredExercises,
    search,
    setSearch,
  } = useExerciseFormFilters(
    component,
    selectedComponentsIds,
    selectedComponent
  );

  const allComponents = lib.common.tree.computeAllItemsAsArray(
    Components,
    'options'
  );

  // root field,
  const rootField = selectedComponent ? selectedComponent.field : component.id;
  const root = lib.common.tree.findNode(
    rootField,
    Components,
    'field',
    'options'
  );

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
      <Box sx={{ py: 1, width: '100%', mx: 'auto', position: 'relative' }}>
        <ExerciseChips
          noSelectionLabel="All"
          selected={selectedComponent}
          setSelected={(component) =>
            setSelectedComponent(component as Component)
          }
          disableNoSelection
          bgColor={theme.palette.background.default}
          primaryColor={theme.palette.primary.main}
          gap={screenSize.isReallySmall ? 1.5 : 3.5}
          disabledComponents={['other', 'competition']}
        />
      </Box>

      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        sx={{ py: 1, mx: 'auto', position: 'relative' }}
        gap={1}
        flexWrap="wrap"
      >
        {root?.options &&
          root.options.map((child) => {
            const isSelected = selectedRootComponentId === child.field;

            const leafes = lib.common.tree.getLeafesFromRootId([child], {
              rootId: child.field,
              idPropertyName: 'field',
              childrenPropertyName: 'options',
            });

            const numLeafesSelected = leafes.filter((leaf) => {
              const tree = computeWholeTree(leaf, allComponents);

              const computedId = computeWholeComponentId(tree);

              if (!computedId) return false;

              return selectedComponentsIds.includes(computedId);
            }).length;

            const allLeafesSelected = numLeafesSelected === leafes.length;

            return (
              <Button
                key={child.field}
                variant="contained"
                disableElevation
                onClick={(e) => handleClickLeaf(e, child.field)}
                endIcon={
                  isSelected ? <KeyboardArrowUp /> : <KeyboardArrowDown />
                }
                sx={
                  allLeafesSelected
                    ? {
                        py: 0.5,
                        mx: screenSize.isMobile ? 'auto' : 0,
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.text.secondary,
                      }
                    : {
                        py: 0.5,
                        mx: screenSize.isMobile ? 'auto' : 0,
                        backgroundColor: theme.palette.background.dark,
                        color: theme.palette.text.primary,
                      }
                }
              >
                {child.name}{' '}
                {numLeafesSelected > 0 &&
                  numLeafesSelected !== leafes.length &&
                  `(${numLeafesSelected}/${leafes.length})`}
              </Button>
            );
          })}
      </Box>

      <Box
        width="80%"
        sx={{ display: screenSize.isMobile ? undefined : 'none' }}
      >
        <SearchBar
          placeholder="Search Exercises"
          value={search}
          handleSearchChange={(e) => setSearch(e.target.value)}
          maxWidth="100%"
        />
      </Box>

      <Box
        width="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ m: 2, mb: 0 }}
        gap={1}
      >
        <Box
          display={screenSize.isMobile ? 'flex' : undefined}
          justifyContent="center"
          width={screenSize.isMobile ? '50%' : '30%'}
        >
          <Box width="30%">
            <Button
              size="small"
              variant="contained"
              sx={{ my: 2 }}
              onClick={() => handleAddExercises()}
            >
              Add
            </Button>
          </Box>
        </Box>

        {selectedRootComponentId && (
          <MenuItemsList<Component>
            anchorEl={anchorElLeaf}
            open={openLeafMenu}
            items={leafComponents}
            idPropertyName="field"
            valuePropertyName="field"
            namePropertyName="name"
            onClose={handleCloseLeaf}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            onMenuItemClick={(e, item) => {
              const foundItem = allComponents.find((i) => i === item);

              if (!foundItem) return;

              const tree = computeWholeTree(foundItem, allComponents);

              const computedId = computeWholeComponentId(tree);

              if (!computedId) return;

              if (selectedComponentsIds.includes(computedId)) {
                setSelectedComponentsIds((prev) =>
                  prev.filter((componentId) => componentId !== computedId)
                );
              } else {
                setSelectedComponentsIds((prev) => [...prev, computedId]);
              }
            }}
            menuItemsSx={(c) => {
              return selectedComponentsIds.some((i) => {
                const tree = computeWholeTree(c, allComponents);

                const computedId = computeWholeComponentId(tree);

                return computedId === i;
              })
                ? {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }
                : {};
            }}
          />
        )}

        <Box
          width="40%"
          sx={{ display: screenSize.isMobile ? 'none' : undefined }}
        >
          <SearchBar
            placeholder="Search Exercises"
            value={search}
            handleSearchChange={(e) => setSearch(e.target.value)}
            maxWidth="100%"
          />
        </Box>

        {/* Filters & Results */}
        <Box
          width={screenSize.isMobile ? '50%' : '30%'}
          display="flex"
          justifyContent={
            screenSize.isSmallerThanLaptop ? 'center' : 'flex-end'
          }
          alignItems="center"
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
            }}
          >
            {!screenSize.isSmallerThanLaptop && (
              <Typography variant="body2" color="text.primary">
                {pagination.total} results
              </Typography>
            )}

            <ExerciseFilter
              filters={filters}
              setFilters={setFilters}
              setPagination={setPagination}
              open={openFilters}
              setOpen={setOpenFilters}
            />
          </Box>
        </Box>
      </Box>

      <SelectedExercisesList
        newAddedExercisesIds={newAddedExercisesIds}
        setNewAddedExercisesIds={setNewAddedExercisesIds}
        setSelectedExerciseIds={setSelectedExerciseIds}
      />

      <ExercisesList
        exercises={filteredExercises}
        addExerciseForm
        selectedExerciseIds={selectedExerciseIds}
        setSelectedExerciseIds={setSelectedExerciseIds}
        newAddedExercisesIds={newAddedExercisesIds}
        setNewAddedExercisesIds={setNewAddedExercisesIds}
      />

      <Box width="100%" display="flex" justifyContent="center">
        <Pagination
          size="medium"
          count={pagination.pages}
          color="primary"
          page={pagination.page}
          onChange={(_, page) => setPagination((prev) => ({ ...prev, page }))}
        />
      </Box>
    </Box>
  );
}
