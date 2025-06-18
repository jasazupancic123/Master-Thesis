import { ILink } from '@/common/type/link.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import SpaIcon from '@mui/icons-material/Spa';
import { ReactNode } from 'react';
import slugify from 'slugify';
import { GroupDateFilter } from '../type/filter.type';
import { Dashboard, Groups, PersonAddAlt1 } from '@mui/icons-material';
import {
  DASHBOARD_ADD_INSTITUTION,
  DASHBOARD_EXERCISES,
  DASHBOARD_GROUPS,
  DASHBOARD_MAIN,
  DASHBOARD_REGISTER_USERS,
} from '@/common/constant/dashboard-views-constant';

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
export const LINK_PROFILE = link('Profile', '/profile', <PersonIcon />);
export const LINK_USERS = link('Users', '/users');
export const LINK_EXERCISES_DASHBOARD = link(
  'Exercises',
  '/dashboard/exercises'
);
export const LINK_COMPONENTS = link('Components', '/components');
export const LINK_EXERCISES = link('Exercises', '/exercises');
export const LINK_GROUPS = link('Trainings', '/groups', <FitnessCenterIcon />);
export const LINK_DASHBOARD = link('Dashboard', '/dashboard', <HomeIcon />);
export const LINK_TRAININGS = link(
  'Trainings',
  '/trainings',
  <FitnessCenterIcon />
);
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
export const LINK_MEMBERS = link('Members', '/members');
export const LINK_SUBGROUPS = link('Subgroups', '/subgroups');
export const LINK_ADD_GROUP = link('Add Group', '/add-group');
export const LINK_SETTINGS = link('Settings', '/settings');
export const LINK_WELLNESS = link('Wellness', '/wellness', <SpaIcon />);
export const LINK_GROUP_BY_ID = (id: string) => link('Group', `/groups/${id}`);
export const LINK_GROUP_DATE_RANGE_VIEW = (
  id: string,
  filter: GroupDateFilter
) => link('Day Trainings', `/groups/${id}/${filter}`);

export const LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS = (groupId: string) => ({
  home: link('Home', `/groups/${groupId}`, <HomeIcon />),
  dashboard: link('Dashboard', `/dashboard`, <Dashboard />),
});

export const LINKS_TRAINER_GROUP_SIDEBAR_SUB_ITEMS = {
  signout: link('Sign out', '#', <LogoutIcon />),
};

export const LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS = (role: string) => ({
  home: link('Home', DASHBOARD_MAIN, <HomeIcon />),
  athletes: link('Groups', DASHBOARD_GROUPS, <Groups />),
  exercises: link('Exercises', DASHBOARD_EXERCISES, <FitnessCenterIcon />),
  addInstitution:
    role === UserRole.ADMIN
      ? link('Add Institution', DASHBOARD_ADD_INSTITUTION, <AddIcon />)
      : undefined,
  register:
    role === UserRole.ADMIN
      ? link('Register Users', DASHBOARD_REGISTER_USERS, <PersonAddAlt1 />)
      : undefined,
});

export const LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS = {
  signout: link('Sign out', '#', <LogoutIcon />),
};

// grouped links (for utility)
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
    groups: LINK_TRAININGS,
    calendar: LINK_CALENDAR,
    chart: LINK_CHART,
    wellness: LINK_META,
    profile: LINK_PROFILE,
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
    exercises: LINK_EXERCISES_DASHBOARD,
    dashboard: LINK_DASHBOARD,
  },
};
