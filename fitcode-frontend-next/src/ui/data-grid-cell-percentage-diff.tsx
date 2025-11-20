import { theme } from '@/app/style';
import { lib } from '@/lib';
import { Box, Typography } from '@mui/material';

interface Props {
  value1: number | undefined;
  value2: number | undefined;
  roundValue?: boolean;
  fontSize?: number | string;
}

export default function DataGridCellPercentageDiff(props: Props) {
  const { value1, value2, roundValue, fontSize } = props;
  if (value1 === undefined) return '-';

  const percentChange = lib.common.number.calculatePercentageDiff(
    value1,
    value2
  );

  const isHigher = percentChange !== null && percentChange > 0;
  const isSame = percentChange === 0;
  const isInt = percentChange !== null && percentChange % 1 === 0;

  const valueString = `${value1 !== undefined ? (roundValue ? Math.round(value1) : value1) : '-'}`;

  return (
    <Box display="flex" width="100%" height="100%" alignItems="center">
      <Typography component="span" lineHeight={1} fontSize={fontSize}>
        {valueString}{' '}
        {percentChange !== null ? (
          <Typography
            component="span"
            lineHeight={1}
            fontSize={fontSize}
            sx={{
              color: isSame
                ? theme.palette.warning.main
                : isHigher
                  ? theme.palette.success.main
                  : theme.palette.error.main,
              display: 'inline',
            }}
          >
            ({isHigher ? '+' : ''}
            {isInt ? percentChange.toFixed(0) : percentChange.toFixed(2)}%)
          </Typography>
        ) : (
          ''
        )}
      </Typography>
    </Box>
  );
}
