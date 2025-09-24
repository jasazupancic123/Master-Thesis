import { styled } from '@mui/material/styles';
import { useDrawingArea } from '@mui/x-charts/hooks';

const StyledText = styled('text')(({ theme }) => ({
  fill: theme.palette.text.primary,
  textAnchor: 'middle',
  dominantBaseline: 'central',
  fontSize: 14,
}));

export function PieCenterLabel({
  label,
  position,
}: {
  label: string;
  position?: {
    top?: number;
    left?: number;
  };
}) {
  const { width, height, left, top } = useDrawingArea();

  const x = (position?.left !== undefined ? position.left : left) + width / 2;
  const y = (position?.top !== undefined ? position.top : top) + height / 2;

  return (
    <StyledText x={x} y={y}>
      {label}
    </StyledText>
  );
}
