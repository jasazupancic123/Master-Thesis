import { Box, Divider, Typography } from '@mui/material';
import { Fragment } from 'react';

import { theme } from '@/app/style';
import { ExerciseParamFieldEnum } from '@/core/exercise/enum/exercise-param-field.enum';
import { IMG_URLS } from '@/lib/common/const/img-urls.const';
import ImgIcon from '@/ui/img-icon';

interface Props {
  params: (
    | number
    | 'dist'
    | 'time'
    | 'reps'
    | 'eff'
    | 'pace'
    | 'watts'
    | 'tempoEcc'
    | 'recDist'
    | 'recTime'
  )[];
  load?: number;
  volParam?: boolean;
  loadParam?: boolean;
}

export default function UnilateralParamsRow(props: Props) {
  const { params, load, volParam, loadParam } = props;

  function ParamText({ text }: { text: string }) {
    return (
      <Typography
        fontSize={12}
        fontWeight={600}
        textAlign="center"
        sx={{
          width: 50,
          color: theme.palette.background.lightBorder,
        }}
      >
        {text}
      </Typography>
    );
  }

  return (
    <Box
      display="flex"
      width="100%"
      justifyContent="center"
      alignItems="center"
      gap={0.9}
    >
      {params.map((param, index) => {
        switch (param) {
          case load: // load is numeric, so we have to check differently
            return volParam && loadParam ? (
              <Fragment key={index}>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    height: 5,
                    my: 'auto',
                    borderColor: 'transparent',
                  }}
                />
                <ParamText text={'Kg'} />
              </Fragment>
            ) : (
              <ParamText key={index} text={'Kg'} />
            );
          case ExerciseParamFieldEnum.EFF:
            return <ParamText key={index} text={'Eff'} />;
          case ExerciseParamFieldEnum.TEMPO_ECC:
            return (
              <Box
                key={index}
                width={50}
                display="flex"
                justifyContent="center"
              >
                <ImgIcon width={14} height={14} src={IMG_URLS.tempo} />
              </Box>
            );
          case ExerciseParamFieldEnum.REC_TIME:
            return (
              <Box
                key={index}
                width={50}
                display="flex"
                justifyContent="center"
              >
                <ImgIcon width={14} height={14} src={IMG_URLS.recTime} />
              </Box>
            );
          case ExerciseParamFieldEnum.DIST:
            return <ParamText key={index} text={'Dist'} />;
          case ExerciseParamFieldEnum.REC_DIST:
            return <ParamText key={index} text={'Rec Dist'} />;
          case ExerciseParamFieldEnum.REPS:
            return <ParamText key={index} text={'Rep'} />;
          case ExerciseParamFieldEnum.TIME:
            return <ParamText key={index} text={'Time'} />;
          default:
            return null;
        }
      })}
    </Box>
  );
}
