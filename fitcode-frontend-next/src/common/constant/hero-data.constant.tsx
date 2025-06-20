import * as React from 'react';
import ViewQuiltRoundedIcon from '@mui/icons-material/ViewQuiltRounded';
import EdgesensorHighRoundedIcon from '@mui/icons-material/EdgesensorHighRounded';
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import ThumbUpAltRoundedIcon from '@mui/icons-material/ThumbUpAltRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';

export const team = [
  { image: '/team/Janez.jpg', name: 'Janez Lovenjak', position: 'Founder' },
  { image: '/team/Tomaz.jpg', name: 'Tomaž Ambrožič', position: 'CEO' },
  { image: '/team/Mitja.jpg', name: 'Mitja Blagajac', position: 'CMO' },
];

export const products = [
    {
        image: '/products/SW4.jpg',
        title: 'SMART WALL',
        description: 'Experience seamless group training support with instant technical feedback and advanced activity monitoring, ensuring each session is enhanced for optimal results and performance.',
    },
    {
        image: '/products/SP2.jpg',
        title: 'SMART POINT',
        description: 'Elevate your individual training with our top-tier performance assessment standards, delivering unmatched precision in measuring power, balance, and mobility.',
    },
    {
        image: '/products/vp2.jpg',
        title: 'HORIZONTAL POINT',
        description: 'Experience a revolutionary solution for real-time measurement of open-space gym-specific training activities, including velocity, acceleration, and braking capacity.',
    },
    {
        image: '/products/VP1.jpg',
        title: 'VERTICAL POINT',
        description: 'Unlock your potential with comprehensive feedback on throwing actions, where ballistic power is crucial for achieving peak performance and maximizing your athletic capabilities.',
    },
    {
        image: '/products/LP.jpg',
        title: 'LIFTING POINT',
        description: 'Incorporate Velocity-Based Training into any lifting exercise in your routine, with enriched feedback that includes Range of Motion, symmetry, and other key performance indicators.',
    },
    {
        image: '/products/FS1.jpg',
        title: 'FitCode SYSTEM',
        description: 'Plan, monitor and report your session with minimal admin effort, tailored to your specific needs. This training managment platform provides pioneering training load insights of strenght programs.',
    },
];

export const features = [
    {
        icon: <ViewQuiltRoundedIcon/>,
        title: 'Movement Technique',
        description: 'Perfect your form and technique with our real-time feedback tool, minimizing the risk of injury and maximizing efficiency.',
        imageLight: 'url("/static/images/templates/templates-images/dash-light.png")',
        imageDark: 'url("/static/images/templates/templates-images/dash-dark.png")',
    },
    {
        icon: <EdgesensorHighRoundedIcon/>,
        title: 'Performance Testing',
        description: 'Assess your strength, endurance, and power with our comprehensive testing tool, tailored to your specific sport or activity.',
        imageLight: 'url("/static/images/templates/templates-images/mobile-light.png")',
        imageDark: 'url("/static/images/templates/templates-images/mobile-dark.png")',
    },
    {
        icon: <DevicesRoundedIcon/>,
        title: 'Balance Measurement',
        description: 'Achieve optimal stability and control with our balance measurement tool, essential for injury prevention and performance enhancement.',
        imageLight: 'url("/static/images/templates/templates-images/devices-light.png")',
        imageDark: 'url("/static/images/templates/templates-images/devices-dark.png")',
    },
    {
        icon: <DevicesRoundedIcon/>,
        title: 'Mobility Assesment',
        description: 'Unlock your full range of motion with our mobility measurement tool, ensuring you move freely and efficiently in all directions.',
        imageLight: 'url("/static/images/templates/templates-images/devices-light.png")',
        imageDark: 'url("/static/images/templates/templates-images/devices-dark.png")',
    },
    {
        icon: <DevicesRoundedIcon/>,
        title: 'Movement Velocity Feedback',
        description: 'Unleash your speed potential with our tool that accurately measures and analyzes your movement velocity, helping you outpace the competition.',
        imageLight: 'url("/static/images/templates/templates-images/devices-light.png")',
        imageDark: 'url("/static/images/templates/templates-images/devices-dark.png")',
    },
    {
        icon: <DevicesRoundedIcon/>,
        title: 'Monitoring',
        description: 'Stay on track with your training goals with our tool that monitors the quality and consistency of your exercise delivery, ensuring you get the most out of every session.',
        imageLight: 'url("/static/images/templates/templates-images/devices-light.png")',
        imageDark: 'url("/static/images/templates/templates-images/devices-dark.png")',
    },
    {
        icon: <DevicesRoundedIcon/>,
        title: 'Biometric Registry',
        description: 'We understand your business needs and offer seamless services, including client registration, that can significantly reduce the time associated with applying technology in your practice.',
        imageLight: 'url("/static/images/templates/templates-images/devices-light.png")',
        imageDark: 'url("/static/images/templates/templates-images/devices-dark.png")',
    },
];

export const trademark = [
    {
        image: '/trademark/access2.jpeg',
        title: 'ACCESSIBILITY',
        description: 'We are moving beyond traditional lab-based routines to offer solutions that provide faster and more convenient access to information, allowing you to make informed decisions right away.',
    },
    {
        image: '/trademark/Custom7.jpg',
        title: 'SPECIFICITY',
        description: 'We prioritize understanding your specific needs in each sport. The result? Meticulously crafted products with thoughtful details that elevate your experience.',
    },
    {
        image: '/trademark/ind3.jpeg',
        title: 'PERSONALIZATION',
        description: 'Practice smarter, not harder. We offer customized solutions that fit to your clients unique training needs.',
    },
    {
        image: '/trademark/inov.jpeg',
        title: 'INNOVATION',
        description: 'Stay Ahead with Standard-Setting Features. We revolutionize the way you coach & the way your clients move, train, and perform.',
    },
    {
        image: '/trademark/Custom8.jpeg',
        title: 'CUSTOMIZATION',
        description: 'Athlete or Enthusiast? Set your clients goals, get matched with the perfect training plan.',
    },
    {
        image: '/trademark/Auto.jpeg',
        title: 'HANDS-OFF PROCESS',
        description: 'Coach, Not Admin? We Got You! Set it and forget it. Focus on Performance, We Handle the Rest',
    },
];

export const highlights = [
    {icon: <SettingsSuggestRoundedIcon/>, title: 'Adaptable performance',},
    {icon: <ConstructionRoundedIcon/>, title: 'Built to last',},
    {icon: <ThumbUpAltRoundedIcon/>, title: 'Great user experience',},
    {icon: <AutoFixHighRoundedIcon/>, title: 'Innovative functionality',},
    {icon: <SupportAgentRoundedIcon/>, title: 'Reliable support',},
    {icon: <QueryStatsRoundedIcon/>, title: 'Precision in every detail',},
];

export const tools = [
    {
        icon: <SettingsSuggestRoundedIcon/>,
        title: 'Movement Technique',
        description: 'Perfect your form and technique with our real-time feedback tool, minimizing the risk of injury and maximizing efficiency.',
        links: [
            {label: 'Squatting', href: 'https://squat-analysis.netlify.app/'},
            {label: 'Hinging', href: '#'},
            {label: 'Pressing', href: '#'},
            {label: 'Pulling', href: '#'},
            {label: 'Jumping', href: '#'},
        ],
    },
    {
        icon: <ConstructionRoundedIcon/>,
        title: 'Performance Testing',
        description: 'Assess your strength, endurance, and power with our comprehensive testing tool, tailored to your specific sport or activity.',
        links: [
            {label: 'Vertical Jump', href: 'https://squat-analysis.netlify.app/'},
            {label: 'Broad Jump', href: 'Recorder'},
            {label: 'Ankle Jumps - 10/5', href: '#'},
            {label: 'Heading', href: 'https://movenet-jump.netlify.app'},
        ],
    },
    {
        icon: <ThumbUpAltRoundedIcon/>,
        title: 'Mobility Assesment',
        description: 'Unlock your full range of motion with our mobility measurement tool, ensuring you move freely and efficiently in all directions.',
        links: [
            {label: 'ROM', href: 'https://llove01.github.io/mediapipe_web_app/'},
            {label: 'Joint by Joint', href: '#'},
        ],
    },
    {
        icon: <ThumbUpAltRoundedIcon/>,
        title: 'Balance Assesment',
        description: 'Achieve optimal stability and control with our balance measurement tool, essential for injury prevention and performance enhancement.',
        links: [
            {label: 'Link 6', href: '#'},
            {label: 'Link 7', href: '#'},
            {label: 'Link 8', href: '#'},
        ],
    },
    {
        icon: <ThumbUpAltRoundedIcon/>,
        title: 'Movement Velocity Assesment',
        description: 'Unleash your speed potential with our tool that accurately measures and analyzes your movement velocity, helping you outpace the competition.',
        links: [
            {label: 'Link 6', href: '#'},
            {label: 'Link 7', href: '#'},
            {label: 'Link 8', href: '#'},
        ],
    },
    {
        icon: <ThumbUpAltRoundedIcon/>,
        title: 'Activity Monitoring',
        description: 'Stay on track with your training goals with our tool that monitors the quality and consistency of your exercise delivery, ensuring you get the most out of every session.',
        links: [
            {label: 'Link 6', href: '#'},
            {label: 'Link 7', href: '#'},
            {label: 'Link 8', href: '#'},
        ],
    },
    {
        icon: <ThumbUpAltRoundedIcon/>,
        title: 'Video Library',
        description: 'Stay on track with your training goals with our tool that monitors the quality and consistency of your exercise delivery, ensuring you get the most out of every session.',
        links: [
            {label: 'Avatar', href: 'https://avatar11.netlify.app'},
            {label: 'Link 7', href: '#'},
            {label: 'Link 8', href: '#'},
        ],
    },
    {
        icon: <ThumbUpAltRoundedIcon/>,
        title: 'Interactive Training',
        description: 'Stay on track with your training goals with our tool that monitors the quality and consistency of your exercise delivery, ensuring you get the most out of every session.',
        links: [
            {label: 'Lights', href: 'https://gameg1.netlify.app'},
            {label: 'Link 7', href: '#'},
            {label: 'Link 8', href: '#'},
        ],
    },
];