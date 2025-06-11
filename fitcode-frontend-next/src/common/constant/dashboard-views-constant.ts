export const DASHBOARD_MAIN = '/dashboard';
export const DASHBOARD_GROUPS = `${DASHBOARD_MAIN}/groups`;
export const DASHBOARD_EXERCISES = `${DASHBOARD_MAIN}/exercises`;
export const DASHBOARD_ADD_INSTITUTION = `${DASHBOARD_MAIN}/add-institution`;
export const DASHBOARD_REGISTER_USERS = `${DASHBOARD_MAIN}/register-users`;

export const DASHBOARD_VIEWS = [
  DASHBOARD_MAIN,
  DASHBOARD_GROUPS,
  DASHBOARD_ADD_INSTITUTION,
  DASHBOARD_REGISTER_USERS,
] as const;
