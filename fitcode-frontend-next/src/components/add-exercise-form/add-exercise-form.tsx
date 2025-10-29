import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, Button, Pagination, Typography } from '@mui/material';

import ExerciseFilter from '../exercises-list/exercise-filter';
import ExercisesList from '../exercises-list/exercises-list';
import type { AddExerciseFormProps } from '../trainer-group-day-view/props/props';
import useExerciseFormComponentExercises from './hooks/use-component-exercises';
import useComponentFilter from './hooks/use-component-filter';
import useExerciseFormFilters from './hooks/use-filters';
import SelectedExercisesList from './selected-exercises-list';
import { theme } from '@/app/style';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import { SearchBar } from '@/ui/search-bar/search-bar';
import MenuItemsList from '@/ui/menu-items-list';
import { Component } from '@/core/component/type/component.type';
import { useMain } from '@/store/main.provider';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/core/training/const/warmup-cooldown.const';
import { core } from '@/core/core.service';
import ExerciseChips from '../exercise-chips/exercise-chips';
import { ComponentIds } from '@/core/training/enum/component-ids.enum';

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

  const { components } = useMain();

  const { pagination, setPagination } = useTrainerDayView();

  const componentExercisesContext =
    useExerciseFormComponentExercises(component);

  const {
    selectedComponent,
    setSelectedComponent,
    filterComponents,
    leafComponents,
    selectedComponentsIds,
    setSelectedComponentsIds,
    selectedRootComponentId,
    anchorElLeaf,
    openLeafMenu,
    handleClickLeaf,
    handleCloseLeaf,
  } = useComponentFilter();

  const {
    filters,
    setFilters,
    openFilters,
    setOpenFilters,
    search,
    setSearch,
    filteredExercises,
  } = useExerciseFormFilters(
    component,
    componentExercisesContext.componentExercises,
    selectedComponentsIds
  );

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
      <Box sx={{ py: 1, width: '100%', mx: 'auto', position: 'relative' }}>
        <ExerciseChips
          noSelectionLabel="All"
          components={core.component.tree(
            components.filter(
              (c) =>
                ![WARMUP_ID, COOLDOWN_ID, ComponentIds.COMPETITION].includes(
                  c.id
                )
            )
          )}
          selected={selectedComponent}
          setSelected={(component) =>
            setSelectedComponent(component as Component)
          }
          dissableNoSelection
          bgColor={theme.palette.background.default}
          primaryColor={theme.palette.primary.main}
          gap={screenSize.isReallySmall ? 1.5 : 3.5}
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
        {filterComponents.map((c) => {
          const numOfSelected = selectedComponentsIds.filter((id) =>
            c.children.some((child) => child.id === id)
          ).length;

          return (
            <Button
              id="demo-customized-button"
              aria-haspopup="true"
              variant="contained"
              disableElevation
              onClick={(e) => handleClickLeaf(e, c.id)}
              endIcon={<KeyboardArrowDown />}
              sx={{
                py: 0.5,
                mx: screenSize.isMobile ? 'auto' : 0,
                backgroundColor: theme.palette.background.dark,
                color: theme.palette.text.primary,
              }}
            >
              {`${c.name}${numOfSelected ? ` (${numOfSelected})` : ''}`}
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
              onClick={() => {
                handleAddExercises();
              }}
            >
              Add
            </Button>
          </Box>

          {selectedRootComponentId && (
            <MenuItemsList<Component>
              anchorEl={anchorElLeaf}
              open={openLeafMenu}
              items={leafComponents}
              idPropertyName="id"
              valuePropertyName="id"
              namePropertyName="name"
              onClose={handleCloseLeaf}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              transformOrigin={{ vertical: 'top', horizontal: 'center' }}
              onMenuItemClick={(e, id) => {
                if (selectedComponentsIds.includes(id)) {
                  setSelectedComponentsIds((prev) =>
                    prev.filter((componentId) => componentId !== id)
                  );
                } else {
                  setSelectedComponentsIds((prev) => [...prev, id]);
                }
              }}
              menuItemsSx={(cId) => {
                return selectedComponentsIds.includes(cId)
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
        </Box>

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
