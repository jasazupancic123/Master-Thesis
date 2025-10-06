import {
  Add,
  CalendarTodayOutlined,
  FitnessCenterOutlined,
  Groups,
  PersonAdd,
  SpaOutlined,
  TrendingUp,
} from '@mui/icons-material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import type { ReactNode } from 'react';
import slugify from 'slugify';

import type { GroupDateFilter } from '../type/filter.type';
import {
  DASHBOARD_ADD_INSTITUTION,
  DASHBOARD_EXERCISES,
  DASHBOARD_INSTITUTION,
  DASHBOARD_MAIN,
  DASHBOARD_PROGRESS,
} from '@/common/constant/dashboard-views-constant';
import type { ILink } from '@/common/type/link.type';
import { UserRole } from '@/controller/profile/enum/user-role.enum';

export function link(
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

// hero navbar
export const LINK_PRODUCT = link('Product', '#product');
export const LINK_SERVICES = link('Services', '#services');
export const LINK_TECHNOLOGY = link('Technology', '/#technology', null, 'technology');
export const LINK_CONTACT_US = link('Contact Us', '/#contact-us', null, 'contact-us');
export const LINK_ABOUT_US = link('About Us', '/#about-us', null, 'about-us');

// all standalone app links
export const LINK_INDEX = link('Home', '/#home', null, 'home');
export const LINK_SOLUTIONS = link('Solutions', '#solutions');
export const LINK_PRODUCTS = link('Products', '#products');
export const LINK_FEATURES = link('Features', '#features');
export const LINK_TRADEMARK = link('Trademark', '#trademark');
export const LINK_HIGHLIGHTS = link('Highlights', '#highlights');
export const LINK_ABOUT = link('Our Vision', '#about');
export const SIGN_IN_LINK_ID = 'sign-in';
export const LINK_SIGN_IN = link(
  'Do it right',
  '/sign-in',
  undefined,
  SIGN_IN_LINK_ID
);
export const SIGN_OUT_LINK_ID = 'sign-out';
export const LINK_SIGN_OUT = link('Sign Out', '#', undefined, SIGN_OUT_LINK_ID);
export const LINK_PROFILE = link('Profile', '/profile', <PersonIcon />);
export const LINK_USERS = link('Users', '/users');
export const LINK_EXERCISES_DASHBOARD = link(
  'Exercises',
  '/dashboard/exercises'
);
export const LINK_COMPONENTS = link('Components', '/components');
export const LINK_GROUPS = link('Trainings', '/groups', <FitnessCenterIcon />);
export const DASHBOARD_LINK_ID = 'dashboard';
export const LINK_DASHBOARD = link(
  'Dashboard',
  '/dashboard',
  <HomeIcon />,
  DASHBOARD_LINK_ID
);
export const LINK_TRAININGS = link(
  'Trainings',
  '/trainings',
  <FitnessCenterOutlined />
);
export const LINK_POSE_DETECTION = link(
  'PoseDetection',
  '/trainings/pose-detection',
  <Groups />
);
export const LINK_TRAINING = link(
  'Training',
  '/training',
  <FitnessCenterIcon />
);
export const LINK_CALENDAR = link(
  'Calendar',
  '/calendar',
  <CalendarTodayOutlined />
);
export const LINK_FEEDBACK = link('Feedback', '/feedback', <SpaOutlined />);

export const LINK_SETTINGS = link('Settings', '/settings');
export const LINK_GROUP_BY_ID = (id: string) =>
  link('Group', `/groups/${id}`, <HomeIcon />);

export const LINK_GROUP_DATE_RANGE_VIEW = (
  id: string,
  filter: GroupDateFilter
) => link('Day Trainings', `/groups/${id}/${filter}`);

export const LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS = (groupId: string) => ({
  home: LINK_GROUP_BY_ID(groupId),
  dashboard: LINK_DASHBOARD,
});

export const LINKS_TRAINER_GROUP_SIDEBAR_SUB_ITEMS = {
  signout: link('Sign out', '#', <LogoutIcon />),
};

export const LINK_DASHBOARD_GROUPS = link('Groups', DASHBOARD_MAIN, <Groups />);
export const LINK_DASHBOARD_INSTITUTION = link(
  'Members',
  DASHBOARD_INSTITUTION,
  <PersonAdd />
);
export const LINK_DASHBOARD_PROGRESS = link(
  'Progress',
  DASHBOARD_PROGRESS,
  <TrendingUp />
);
export const LINK_EXERCISES_DASHBOARD_NAVIGATION = link(
  'Exercises',
  DASHBOARD_EXERCISES,
  <FitnessCenterIcon />
);
export const LINK_ADD_INSTITUTION = link(
  'Add',
  DASHBOARD_ADD_INSTITUTION,
  <Add />
);

export const LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS = (role: UserRole) => ({
  home: LINK_DASHBOARD_GROUPS,
  institution: LINK_DASHBOARD_INSTITUTION,
  exercises: LINK_EXERCISES_DASHBOARD_NAVIGATION,
  addInstitution: role === UserRole.ADMIN ? LINK_ADD_INSTITUTION : undefined,
});

export const LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS = {
  signout: link('Sign out', '#', <LogoutIcon />),
};

// grouped links (for utility)
export const LINKS_AUTH = {
  login: LINK_SIGN_IN,
};

export const LINKS_HERO_NAVBAR = {
  home: LINK_INDEX,
  aboutUs: LINK_ABOUT_US,
  contactUs: LINK_CONTACT_US,
  technology: LINK_TECHNOLOGY,
};

export const LINKS_AUTHENTICATED_HERO_NAVBAR: Record<
  UserRole,
  Record<string, ILink>
> = {
  [UserRole.ATHLETE]: { trainings: LINK_TRAININGS, signout: LINK_SIGN_OUT },
  [UserRole.TRAINER]: { dashboard: LINK_DASHBOARD, signout: LINK_SIGN_OUT },
  [UserRole.MANAGER]: { dashboard: LINK_DASHBOARD, signout: LINK_SIGN_OUT },
  [UserRole.ADMIN]: { dashboard: LINK_DASHBOARD, signout: LINK_SIGN_OUT },
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

export const LINKS_SIDEBAR_GROUP_VIEW = {
  [UserRole.ATHLETE]: {
    trainings: LINK_TRAININGS,
    calendar: LINK_CALENDAR,
    feedback: LINK_FEEDBACK,
    profile: LINK_PROFILE,
  },
  [UserRole.TRAINER]: {
    dashboard: LINK_DASHBOARD,
    profile: LINK_PROFILE,
    settings: LINK_SETTINGS,
  },
  [UserRole.MANAGER]: {
    dashboard: LINK_DASHBOARD,
    profile: LINK_PROFILE,
    settings: LINK_SETTINGS,
  },
  [UserRole.ADMIN]: {
    users: LINK_USERS,
    components: LINK_COMPONENTS,
    exercises: LINK_EXERCISES_DASHBOARD,
    dashboard: LINK_DASHBOARD,
  },
};

export const LINKS_SIDEBAR_DAHBOARD_VIEW = {
  [UserRole.ATHLETE]: {},
  [UserRole.TRAINER]: {
    profile: LINK_PROFILE,
    settings: LINK_SETTINGS,
  },
  [UserRole.MANAGER]: {
    profile: LINK_PROFILE,
    settings: LINK_SETTINGS,
  },
  [UserRole.ADMIN]: {
    profile: LINK_PROFILE,
    settings: LINK_SETTINGS,
    users: LINK_USERS,
    components: LINK_COMPONENTS,
  },
};

export const SIGN_IN_REDIRECT_MAPPER = {
  [UserRole.ATHLETE]: LINK_TRAININGS,
  [UserRole.TRAINER]: LINK_DASHBOARD,
  [UserRole.MANAGER]: LINK_DASHBOARD,
  [UserRole.ADMIN]: LINK_DASHBOARD,
};
