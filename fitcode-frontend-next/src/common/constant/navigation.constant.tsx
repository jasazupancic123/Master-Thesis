import { ILink } from '@/common/type/link.type';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SpaIcon from '@mui/icons-material/Spa';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import slugify from 'slugify';
import { ReactNode } from 'react';

function link(
  label: string,
  href: string,
  icon?: ReactNode,
  id?: string
): ILink {
  return {
    label,
    href,
    icon,
    id: id ? id : slugify(label),
  };
}

// all standalone app links
export const LINK_INDEX = link('Home', '/', null, '');
export const LINK_SOLUTIONS = link('Solutions', '#solutions');
export const LINK_PRODUCTS = link('Products', '#products');
export const LINK_FEATURES = link('Features', '#features');
export const LINK_TRADEMARK = link('Trademark', '#trademark');
export const LINK_HIGHLIGHTS = link('Highlights', '#highlights');
export const LINK_ABOUT = link('Our Vision', '#about');
export const LINK_SIGN_IN = link('Sign In', '/sign-in');
export const LINK_SIGN_UP = link('Sign Up', '/sign-up');
export const LINK_PROFILE = link('Profile', '/profile');
export const LINK_USERS = link('Users', '/users');
export const LINK_COMPONENTS = link('Components', '/components');
export const LINK_EXERCISES = link('Exercises', '/exercises');
export const LINK_GROUPS = link('Trainings', '/groups', <FitnessCenterIcon />);
export const LINK_CHART = link('Chart', '/chart', <BarChartIcon />);
export const LINK_META = link('Wellness', '/wellness', <SpaIcon />);
export const LINK_TRAINING = link(
  'Training',
  '/training',
  <FitnessCenterIcon />
);
export const LINK_CALENDAR = link(
  'Calendar',
  '/calendar',
  <CalendarTodayIcon />
);

// grouped linked (for utility)
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
    wellness: LINK_META,
  },
  [UserRole.TRAINER]: {
    exercises: LINK_EXERCISES,
    groups: LINK_GROUPS,
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
