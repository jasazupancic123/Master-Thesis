import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import { link } from '@/common/constant/navigation.constant';

export const DRAWER_WIDTH = 240;

export const LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS = (groupId: string) => ({
  home: link('Home', `/groups/${groupId}`, <HomeIcon />),
  exercises: link(
    'Exercises',
    `/groups/${groupId}/exercises`,
    <FitnessCenterIcon />
  ),
  members: link('Members', `/groups/${groupId}/members`, <PeopleIcon />),
  createGroup: link(
    'Create group',
    `/groups/${groupId}/add-group`,
    <AddIcon />
  ),
  settings: link('Settings', `/groups/${groupId}/settings`, <SettingsIcon />),
});

export const LINKS_TRAINER_GROUP_SIDEBAR_SUB_ITEMS = {
  signout: link('Sign out', '#', <LogoutIcon />),
};
