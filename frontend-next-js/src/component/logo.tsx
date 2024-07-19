import {LOGO_URL} from '@/constant/image'
import Image from 'next/image'

interface LogoProps {
    width?: number;
    height?: number;
}

export default function Logo(props: LogoProps = {width: 100, height: 50}) {
    const {width, height} = props
    return <Image src={LOGO_URL} alt="Logo" width={width} height={height}/>
}