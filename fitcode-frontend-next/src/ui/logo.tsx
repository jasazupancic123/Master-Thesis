import Image from 'next/image';

import {
  LOGO_BLACK_IMG_URL,
  LOGO_IMG_URL,
} from '@/lib/common/const/image.const';

interface Props {
  width?: number;
  height?: number;
  marginLeft?: number;
  sx?: React.CSSProperties; // Ensure correct type for styles
  version?: 'dark';
}

export default function Logo({ width = 100, marginLeft, sx, version }: Props) {
  const src = version === 'dark' ? LOGO_BLACK_IMG_URL : LOGO_IMG_URL;

  return (
    <Image
      src={src}
      alt="Logo"
      width={width}
      height={0}
      style={{ marginLeft, ...sx }} // Correctly spread additional styles
      layout="intrinsic"
      unoptimized
    />
  );
}
