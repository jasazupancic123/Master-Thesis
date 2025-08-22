import { COLOR } from '@/common/constant/color.constant';

export const getBorderGradient = (
  supersetIndex: number,
  onlyOneSuperset: boolean = false
): string => {
  const fromColor = COLOR[supersetIndex % COLOR.length];
  const toColor = onlyOneSuperset
    ? COLOR[(supersetIndex + 1) % COLOR.length]
    : COLOR[(supersetIndex + 1) % COLOR.length];

  const dirrection = 'to bottom';
  return `linear-gradient(${dirrection}, ${fromColor}, ${toColor})`;
};
