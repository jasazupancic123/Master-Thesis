import { COLOR } from '@/common/constant/browser.constant';
import { useScreenSize } from '@/context/screen-size-provider';
import { useTraining } from '@/context/training-provider';
import {
  Superset,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { CheckCircle, ConstructionOutlined } from '@mui/icons-material';
import SportsIcon from '@mui/icons-material/Sports';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, Grid2, IconButton, Tooltip } from '@mui/material';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';
import BorderColor from '../border-color';
import MyModal from '../modal';
import { SetExerciseAttribute } from '../trainer-day-view/exercise-card-set-attribute';
import { AthleteTrainingExerciseCardProps } from './props';
import { useTheme } from '@mui/material';
import { ExerciseParam } from '../trainer-day-view/exercise-card/exercise-param';

export default function AthleteTrainingExerciseCard(
  props: AthleteTrainingExerciseCardProps
) {
  const theme = useTheme();
  const { components, setView, training, profile } = props;
  const screenSize = useScreenSize();

  const {
    selectedTraining,
    setSelectedTraining,
    selectedComponent,
    setSelectedComponent,
    setUserId,
  } = useTraining();

  const [selectedSuperset, setSelectedSuperset] = useState<Superset | null>(
    null
  );
  const [selectedExercises, setSelectedExercises] = useState<
    TrainingExercise[]
  >([]);
  const [supersets, setSupersets] = useState<Superset[]>();
  const [openAreYouSureModal, setOpenAreYouSureModal] = useState(false);
  const [openVideoPlayerModal, setOpenVideoPlayerModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (!selectedComponent) return;
    let usersSupersets = undefined;
    for (const subgroup of selectedComponent.subgroups) {
      if (subgroup.membersIds.includes(profile.uid)) {
        usersSupersets = subgroup.supersets;
        break;
      }
    }
    if (!usersSupersets) {
      usersSupersets = selectedComponent.supersets; //default group
    }
    setSupersets(usersSupersets);
  }, [selectedComponent]);

  useEffect(() => {}, [supersets]);

  useEffect(() => {
    if (!selectedSuperset) return;
    const newExercises = selectedSuperset.exercises;
    setSelectedExercises(newExercises);
    if (!newExercises || newExercises.length === 0) return;

    //TODO()
  }, [selectedSuperset]);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      <Box width="100%" display="flex" justifyContent="center">
        <Box
          display="flex"
          flexDirection="column"
          width="100%"
          sx={{
            borderRadius: 2,
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <Box display="flex" flexDirection="column" width="100%" gap={0.25}>
            {components.map((c, i, arr) =>
              c.id === selectedComponent?.id &&
              training.id === selectedTraining?.id ? (
                <Box
                  key={c.id}
                  display="flex"
                  flexDirection="column"
                  sx={{
                    p: 0,
                    pt: 0.5,
                    m: 0,
                    border: `1px solid ${theme.palette.primary.main}`,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Box
                    width="100%"
                    key={`${c.id}`}
                    sx={{
                      py: 1,
                      position: 'relative',
                    }}
                  >
                    <Tooltip
                      title={c.id[0].toUpperCase() + c.id.slice(1)}
                      placement="top"
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          textTransform: 'uppercase',
                          color: theme.palette.primary.main,
                          textAlign: 'center !important',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          px: 7,
                          maxWidth: '100%', // Adjust width as needed
                        }}
                        onClick={() => {
                          setSelectedComponent(null);
                          setSelectedTraining(null);
                        }}
                      >
                        {c.id}
                      </Typography>
                    </Tooltip>
                    <IconButton
                      sx={{
                        p: 0,
                        m: 0,
                        position: 'absolute',
                        top: 7,
                        left: 12,
                      }}
                      onClick={() => setOpenAreYouSureModal(true)}
                    >
                      <SportsIcon sx={{ fontSize: 35 }} />
                    </IconButton>
                  </Box>
                  <CardContent
                    sx={{
                      px: 2,
                      pt: 0.5,
                    }}
                  >
                    <Box display="flex" flexDirection="column" gap={2}>
                      {supersets?.map((superset, i) => (
                        <Box
                          key={`superset-${selectedComponent.id}-${i}`}
                          display="flex"
                          flexDirection="column"
                          gap={0.25}
                        >
                          <BorderColor
                            color={COLOR[i % COLOR.length]}
                            applyMargin
                            marginValue={
                              superset.exercises.length === 0 ? '3px' : '2px'
                            }
                          />

                          {superset.exercises.map((exercise, exerciseIndex) => (
                            <Box
                              key={`exercise-container-${exercise.id}`}
                              display="flex"
                              flexDirection="column" // Ensures vertical stacking
                              sx={{
                                position: 'relative',
                                backgroundColor:
                                  selectedSuperset === superset
                                    ? exercise.exercise?.imageUrl
                                      ? 'rgba(0, 0, 0, 0.6)'
                                      : 'background.default'
                                    : 'background.default', // Darker background to improve contrast
                                backgroundImage:
                                  selectedSuperset === superset
                                    ? exercise.exercise?.imageUrl
                                      ? `url(${exercise.exercise?.imageUrl})`
                                      : undefined
                                    : undefined,
                                backgroundPosition:
                                  selectedSuperset === superset
                                    ? 'center'
                                    : undefined,
                                backgroundSize:
                                  selectedSuperset === superset
                                    ? '100% auto'
                                    : undefined, // Ensures full width, height adjusts
                                backgroundRepeat:
                                  selectedSuperset === superset
                                    ? 'no-repeat'
                                    : undefined,
                                overflow:
                                  selectedSuperset === superset
                                    ? 'hidden'
                                    : undefined,
                              }}
                            >
                              <Box
                                key={exercise.id}
                                display="flex"
                                width="100%"
                                justifyContent="center"
                                alignItems="center"
                                sx={{
                                  backgroundColor: exercise.exercise?.imageUrl
                                    ? 'transparent'
                                    : '#273747',
                                }}
                                py={0.5}
                              >
                                <Tooltip
                                  title={exercise.exercise?.name}
                                  placement="top"
                                >
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontWeight: 'bold',
                                      textTransform: 'uppercase',
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                      textOverflow: 'ellipsis',
                                      maxWidth: '80%', // Adjust width as needed
                                      zIndex: 10,
                                      cursor:
                                        superset === selectedSuperset
                                          ? 'pointer'
                                          : undefined,
                                    }}
                                    onClick={() => {
                                      if (superset === selectedSuperset) {
                                        setOpenVideoPlayerModal(true);
                                        setVideoUrl(
                                          exercise.exercise?.videoUrl || ''
                                        );
                                      }
                                    }}
                                  >
                                    {exercise.exercise?.name ||
                                      'Unnamed Exercise'}
                                  </Typography>
                                </Tooltip>

                                {exerciseIndex === 0 && (
                                  <IconButton
                                    onClick={() => {
                                      if (superset === selectedSuperset) {
                                        setSelectedSuperset(null);
                                        setSelectedExercises([]);
                                      } else {
                                        setSelectedSuperset(superset);
                                      }
                                    }}
                                    sx={{
                                      py: 0,
                                      m: 0,
                                      position: 'absolute',
                                      right: screenSize.isMobile ? 14 : 20,
                                      zIndex: 11,
                                    }}
                                  >
                                    {selectedSuperset === superset ? (
                                      <VisibilityOffIcon />
                                    ) : (
                                      <VisibilityIcon />
                                    )}
                                  </IconButton>
                                )}
                              </Box>
                              {selectedSuperset === superset && (
                                <Box
                                  sx={{
                                    width: '100% !important',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(38, 54, 70, 0.825)', // Darker overlay for better text contrast
                                    zIndex: 0,
                                    opacity: 100,
                                  }}
                                />
                              )}
                              {selectedExercises.includes(exercise) && (
                                <Box
                                  key={exercise.id}
                                  display="flex"
                                  flexDirection="column"
                                  width="100%"
                                  gap={1}
                                  p={1}
                                  pt={0}
                                >
                                  {exercise.sets.map((set, i) => {
                                    return (
                                      <Box
                                        display="flex"
                                        width="100%"
                                        justifyContent="center"
                                        alignItems="center"
                                        gap={1}
                                      >
                                        {exercise.params.map((param, j) => {
                                          const value = set.paramValues.find(
                                            (pv) => pv.field === param.field
                                          ) || {
                                            field: param.field,
                                            selected: 'set',
                                            value: (i + 1).toString(),
                                          };

                                          return (
                                            <Box
                                              key={param.field}
                                              flexBasis={
                                                (
                                                  100 / exercise.params.length
                                                ).toString() + '%'
                                              }
                                            >
                                              <ExerciseParam
                                                readOnly={true}
                                                showOptions={i === 0}
                                                disableOptions
                                                disableSets
                                                param={param}
                                                value={value}
                                                onOptionChange={(
                                                  newValue
                                                ) => {}}
                                                onSubOptionChange={(
                                                  newValue
                                                ) => {}}
                                              />
                                            </Box>
                                          );
                                        })}
                                      </Box>
                                    );
                                  })}
                                </Box>
                              )}
                            </Box>
                          ))}

                          {superset.exercises.length === 0 && (
                            <BorderColor
                              color={COLOR[i % COLOR.length]}
                              lower
                              applyMargin
                              marginValue={
                                superset.exercises.length === 0 ? '3px' : '5px'
                              }
                            />
                          )}
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Box>
              ) : (
                <Box
                  key={`${c.id}`}
                  width="100%"
                  sx={{
                    backgroundColor: c.completedMembersIds.includes(profile.uid)
                      ? '#2f3940'
                      : '#404c54',
                    py: 1,
                    borderTopRightRadius: i === 0 ? 5 : 0,
                    borderBottomRightRadius: i === arr.length - 1 ? 5 : 0,
                    borderBottomLeftRadius: i === arr.length - 1 ? 5 : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => {
                    if (c.completedMembersIds.includes(profile.uid)) return;
                    setSelectedTraining(training);
                    setSelectedComponent(c);
                    setUserId(profile.uid);
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      textTransform: 'uppercase',
                      color: c.completedMembersIds.includes(profile.uid)
                        ? 'rgba(228, 236, 233, 0.5)'
                        : 'rgb(228, 236, 233)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      px: 1,
                      maxWidth: '100%', // Adjust width as needed
                    }}
                  >
                    {c.id}
                  </Typography>
                  <CheckCircle
                    sx={{
                      position: 'absolute',
                      right: 10,
                      color: theme.palette.primary.main,
                      display: c.completedMembersIds.includes(profile.uid)
                        ? undefined
                        : 'none',
                    }}
                  />
                </Box>
              )
            )}
          </Box>
        </Box>
      </Box>

      <MyModal
        isOpen={openAreYouSureModal}
        setIsOpen={(open) => setOpenAreYouSureModal(open)}
        cancelText="Cancel"
        onCancel={() => setOpenAreYouSureModal(false)}
        onConfirm={() => {
          setView('training');
          setOpenAreYouSureModal(false);
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          You've smashed the training button. Ready to kick things off?
        </Typography>
      </MyModal>
      <MyModal
        isOpen={openVideoPlayerModal}
        setIsOpen={(open) => setOpenVideoPlayerModal(open)}
        cancelText="Close"
        onCancel={() => {
          setVideoUrl('');
          setOpenVideoPlayerModal(false);
        }}
        sx={{ p: videoUrl.length > 0 ? 0 : undefined }}
        dialogueContentSx={{ p: videoUrl.length > 0 ? 0 : undefined }}
      >
        {videoUrl.length > 0 ? (
          <Box
            component="video"
            src={videoUrl}
            controls
            autoPlay
            muted
            loop
            sx={{
              width: '100%', // Make it responsive
              maxWidth: screenSize.isLandscapeMobile ? 400 : 600, // Limit max width
            }}
          />
        ) : (
          <Typography variant="body2">No video available</Typography>
        )}
      </MyModal>
    </Box>
  );
}
