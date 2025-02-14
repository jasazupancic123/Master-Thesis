import Image from 'next/image';

interface Props {
  width?: number;
  height?: number;
  marginLeft?: number;
  sx?: React.CSSProperties; // Ensure correct type for styles
  version?: 'wide' | 'narrow';
}

export default function Logo({
  width = 100,
  height = 50,
  marginLeft,
  sx,
  version,
}: Props) {
  return (
    <Image
      src={
        version === 'narrow'
          ? '/fitcode_logo_transparent.png'
          : '/fitcode_logo_transparent_wide.png'
      }
      alt="Logo"
      width={width}
      height={height}
      style={{ marginLeft, ...sx }} // Correctly spread additional styles
    />
  );
}
