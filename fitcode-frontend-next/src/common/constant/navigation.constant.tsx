import { UserRole } from '@/user/enum/user-role.enum';
import { ILink } from '@/common/type/link.type';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SpaIcon from '@mui/icons-material/Spa';

export const LINK_INDEX: ILink = { label: 'Home', href: '/', id: '' };
export const LINK_SOLUTIONS: ILink = { label: 'Solutions', href: '#solutions', id: '#solutions' };
export const LINK_PRODUCTS: ILink = { label: 'Products', href: '#products', id: '#products' };
export const LINK_FEATURES: ILink = { label: 'Features', href: '#features', id: '#features' };
export const LINK_TRADEMARK: ILink = { label: 'Trademark', href: '#trademark', id: '#trademark' };
export const LINK_HIGHLIGHTS: ILink = { label: 'Highlights', href: '#highlights', id: '#highlights' };
export const LINK_ABOUT: ILink = { label: 'Our Vision', href: '#about', id: '#about-us' };
export const LINK_SIGN_IN: ILink = { label: 'Sign In', href: '/sign-in', id: '#sign-in' };
export const LINK_SIGN_UP: ILink = { label: 'Sign Up', href: '/sign-up', id: '#sign-up' };
export const LINK_PROFILE: ILink = { label: 'Profile', href: '/profile', id: '#profile' };
export const LINK_USERS: ILink = { label: 'Users', href: '/users', id: '#users' };
export const LINK_MEMBERS: ILink = {
  label: 'Members',
  href: '/members',
  id: '#members',
};
export const LINK_SUBGROUPS: ILink = {
  label: 'Subgroups',
  href: '/subgroups',
  id: '#subgroups',
};
export const LINK_ADD_GROUP: ILink = {
  label: 'Add Group',
  href: '/add-group',
  id: '#add-group',
};
export const LINK_SETTINGS: ILink = {
  label: 'Settings',
  href: '/settings',
  id: '#settings',
};
export const LINK_COMPONENTS: ILink = {
  label: 'Components',
  href: '/components',
  id: '#components',
};
export const LINK_EXERCISES: ILink = {
  label: 'Exercises',
  href: '/exercises',
  id: '#exercises',
};
export const LINK_GROUPS: ILink = {
  label: 'Trainings',
  href: '/groups',
  id: '#groups',
  icon: <FitnessCenterIcon />,
};
export const LINK_CHART: ILink = {
  label: 'Chart',
  href: '/chart',
  id: '#chart',
  icon: <BarChartIcon />,
};
export const LINK_WELLNESS: ILink = {
  label: 'Wellness',
  href: '/wellness',
  id: '#wellness',
  icon: <SpaIcon />,
};
export const LINK_TRAINING: ILink = {
  label: 'Training',
  href: '/training',
  id: '#training',
  icon: <FitnessCenterIcon />,
};
export const LINK_CALENDAR: ILink = {
  label: 'Calendar',
  href: '/calendar',
  id: '#calendar',
  icon: <CalendarTodayIcon />,
};

export const LINKS_AUTH = {
  login: LINK_SIGN_IN,
  register: LINK_SIGN_UP,
};

export const LINKS_NAVBAR = {
  index: LINK_INDEX,
  solutions: LINK_SOLUTIONS,
  products: LINK_PRODUCTS,
  features: LINK_FEATURES,
  trademark: LINK_TRADEMARK,
  highlights: LINK_HIGHLIGHTS,
  about: LINK_ABOUT,
};

export const LINKS_SIDEBAR = {
  [UserRole.ATHLETE]: {
    groups: LINK_GROUPS,
    chart: LINK_CHART,
    calendar: LINK_CALENDAR,
    wellness: LINK_WELLNESS,
  },
  [UserRole.TRAINER]: {
    home: LINK_GROUPS,
    exercises: LINK_EXERCISES,
    members: LINK_MEMBERS,
    add: LINK_ADD_GROUP,
    settings: LINK_SETTINGS,
  },
  [UserRole.MANAGER]: {
    groups: LINK_GROUPS,
  },
  [UserRole.ADMIN]: {
    users: LINK_USERS,
    components: LINK_COMPONENTS,
    exercises: LINK_EXERCISES,
  },
};