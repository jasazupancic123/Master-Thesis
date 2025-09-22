import Image from 'next/image';

interface Props {
  width?: number;
  height?: number;
  marginLeft?: number;
  sx?: React.CSSProperties; // Ensure correct type for styles
}

export default function Logo({ width = 100, marginLeft, sx }: Props) {
  return (
    <Image
      src="/blind-off-logo.png"
      alt="Logo"
      width={width}
      height={0}
      style={{ marginLeft, ...sx }} // Correctly spread additional styles
      layout="intrinsic"
    />
  );
}
