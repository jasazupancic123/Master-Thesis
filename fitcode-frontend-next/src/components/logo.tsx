import Image from 'next/image';

interface Props {
  width?: number;
  height?: number;
}

export default function Logo(props: Props) {
  const { width = 100, height = 50 } = props;
  return (
    <Image
      src="/fitcode_logo_wide_transparent.png"
      alt="Logo"
      width={width}
      height={height}
    />
  );
}