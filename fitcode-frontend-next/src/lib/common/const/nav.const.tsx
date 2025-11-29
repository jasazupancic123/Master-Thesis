import {
  Add,
  CalendarTodayOutlined,
  Logout,
  Settings,
  SpaOutlined,
} from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import slugify from 'slugify';

import { UserRole } from '@/core/profile/enum/user-role.enum';
import type { ILink } from '@/lib/common/type/link.type';

export function linkPngIcon(
  label: string,
  href: string,
  id?: string,
  src?: string,
  dimension: number = 16
): ILink {
  const icon = (
    <Box
      component="img"
      width={dimension}
      height={dimension}
      src={src}
      sx={{ objectFit: 'contain' }}
    />
  );

  const selectedUrl = `${src?.substring(0, src.lastIndexOf('.'))}-selected.${src?.substring(src.lastIndexOf('.') + 1)}`;

  const selectedIcon = (
    <Box
      component="img"
      width={dimension}
      height={dimension}
      src={selectedUrl}
      sx={{ objectFit: 'contain' }}
    />
  );

  return {
    label,
    href,
    icon,
    selectedIcon,
    id: id ? id : slugify(label),
  };
}

export function link(
  label: string,
  href: string,
  icon?: ReactNode,
  selectedIcon?: ReactNode,
  id?: string
): ILink {
  return {
    label,
    href,
    icon,
    selectedIcon,
    id: id ? id : slugify(label),
  };
}

// hero navbar
export const LINK_TECHNOLOGY = link(
  'Technology',
  '/#technology',
  null,
  'technology'
);
export const LINK_CONTACT_US = link(
  'Contact Us',
  '/#contact-us',
  null,
  'contact-us'
);
export const LINK_ABOUT_US = link('About Us', '/#about-us', null, 'about-us');
export const LINK_METHODOLOGIES = link(
  'Methodology',
  '/methodology',
  null,
  'methodology'
);

// all standalone app links
export const LINK_INDEX = link('Home', '/#home', null, 'home');
export const SIGN_IN_LINK_ID = 'sign-in';
export const LINK_SIGN_IN = link(
  'Login',
  '/sign-in',
  undefined,
  SIGN_IN_LINK_ID
);
export const SIGN_OUT_LINK_ID = 'sign-out';
export const LINK_SIGN_OUT = link(
  'Sign Out',
  '#',
  <Logout />,
  SIGN_OUT_LINK_ID
);
export const LINK_PROFILE = link('Profile', '/profile', <PersonIcon />);
export const LINK_USERS = link('Users', '/users');
export const LINK_EXERCISES_DASHBOARD = link(
  'Exercises',
  '/dashboard/exercises'
);
export const LINK_COMPONENTS = link('Components', '/components');
export const DASHBOARD_LINK_ID = 'dashboard';
export const LINK_DASHBOARD = link(
  'Dashboard',
  '/dashboard',
  <HomeIcon />,
  DASHBOARD_LINK_ID
);

export const LINK_ATHLETE_HOME = link('Home', '/home', <HomeIcon />);

export const LINK_CALENDAR = link(
  'Calendar',
  '/calendar',
  <CalendarTodayOutlined />
);

export const LINK_FEEDBACK = link('Feedback', '/feedback', <SpaOutlined />);

export const LINK_SETTINGS = link('Settings', '/settings', <Settings />);
export const LINK_GROUP_BY_ID = (id: string) =>
  link('Group', `/groups/${id}`, <HomeIcon />);

export const LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS = (groupId: string) => ({
  home: LINK_GROUP_BY_ID(groupId),
  dashboard: LINK_DASHBOARD,
});

export const DASHBOARD_MAIN = '/dashboard';

export const DASHBOARD_ICONS_FOLDER = '/dashboard-icons';
const DASHBOARD_ICONS_DIMENSION = 18;

export const LINK_DASHBOARD_HOME = linkPngIcon(
  'Home',
  '/dashboard',
  'dashboard-home',
  `${DASHBOARD_ICONS_FOLDER}/home.png`,
  DASHBOARD_ICONS_DIMENSION
);

export const LINK_DASHBOARD_SCHEDULE = linkPngIcon(
  'Schedule',
  '/dashboard',
  'dashboard-training-plan',
  `${DASHBOARD_ICONS_FOLDER}/training-plan.png`,
  DASHBOARD_ICONS_DIMENSION
);

export const LINK_DASHBOARD_REPORTS = linkPngIcon(
  'Reports',
  '/dashboard/reports',
  'dashboard-reports',
  `${DASHBOARD_ICONS_FOLDER}/reports.png`,
  DASHBOARD_ICONS_DIMENSION
);

export const LINK_DASHBOARD_MEMBERS = linkPngIcon(
  'Members',
  '/dashboard/members',
  'dashboard-members',
  `${DASHBOARD_ICONS_FOLDER}/members.png`,
  DASHBOARD_ICONS_DIMENSION
);

export const LINK_DASHBOARD_SETTINGS = linkPngIcon(
  'Settings',
  '/dashboard/settings',
  'dashboard-settings',
  `${DASHBOARD_ICONS_FOLDER}/settings.png`,
  DASHBOARD_ICONS_DIMENSION
);

export const LINK_DASHBOARD_PLANNING = linkPngIcon(
  'Planning',
  '/dashboard/groups',
  'dashboard-groups',
  `${DASHBOARD_ICONS_FOLDER}/groups.png`,
  DASHBOARD_ICONS_DIMENSION
);

export const LINK_DASHBOARD_EXERCISES = linkPngIcon(
  'Exercises',
  '/dashboard/exercises',
  'dashboard-exercises',
  `${DASHBOARD_ICONS_FOLDER}/exercises.png`,
  DASHBOARD_ICONS_DIMENSION
);

export const LINK_DASHBOARD_ADD_INSTITUTION = link(
  'Add Institution',
  '/dashboard/add-institution',
  <Add sx={{ fontSize: DASHBOARD_ICONS_DIMENSION }} />,
  <Add
    sx={{ fontSize: DASHBOARD_ICONS_DIMENSION, color: 'background.default' }}
  />,
  'dashboard-add-institution'
);

export const INSTITUTION_PAGE_ID = 'institution-page';

export const DASHBOARD_VIEWS = (role: UserRole): ILink[] => {
  const links = [
    LINK_DASHBOARD_HOME,
    LINK_DASHBOARD_SCHEDULE,
    LINK_DASHBOARD_REPORTS,
    LINK_DASHBOARD_MEMBERS,
    LINK_DASHBOARD_EXERCISES,
    LINK_DASHBOARD_SETTINGS,
    LINK_DASHBOARD_PLANNING,
  ];

  if (role === UserRole.ADMIN) links.push(LINK_DASHBOARD_ADD_INSTITUTION);

  return links;
};

export const LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS = {
  signout: link('Sign out', '#', <LogoutIcon />),
};

// grouped links (for utility)
export const LINKS_AUTH = { login: LINK_SIGN_IN };
export const LINKS_HERO_NAVBAR = {
  home: LINK_INDEX,
  aboutUs: LINK_ABOUT_US,
  technology: LINK_TECHNOLOGY,
  contactUs: LINK_CONTACT_US,
};

export const LINKS_AUTHENTICATED_HERO_NAVBAR: Record<
  UserRole,
  Record<string, ILink>
> = {
  [UserRole.ATHLETE]: { trainings: LINK_ATHLETE_HOME, signout: LINK_SIGN_OUT },
  [UserRole.TRAINER]: { dashboard: LINK_DASHBOARD, signout: LINK_SIGN_OUT },
  [UserRole.MANAGER]: { dashboard: LINK_DASHBOARD, signout: LINK_SIGN_OUT },
  [UserRole.ADMIN]: { dashboard: LINK_DASHBOARD, signout: LINK_SIGN_OUT },
};

export const LINKS_SIDEBAR_GROUP_VIEW = {
  [UserRole.ATHLETE]: {
    trainings: LINK_ATHLETE_HOME,
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
  [UserRole.ATHLETE]: LINK_ATHLETE_HOME,
  [UserRole.TRAINER]: LINK_DASHBOARD,
  [UserRole.MANAGER]: LINK_DASHBOARD,
  [UserRole.ADMIN]: LINK_DASHBOARD,
};
