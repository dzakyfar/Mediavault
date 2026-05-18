export type UserRole = 'client' | 'freelancer';
export type RoleSelection = UserRole | 'both';

export interface MockUserSession {
  uid: string;
  email: string;
  name: string;
  roles: UserRole[];
  activeRole?: UserRole;
  createdAt: string;
  lastLoginAt: string;
}

const USERS_KEY = 'mediavault.mock.users.v2';
const ACTIVE_EMAIL_KEY = 'mediavault.mock.activeEmail.v2';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const createUid = (email: string) => {
  let hash = 0;
  for (let i = 0; i < email.length; i += 1) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  return `mv_${Math.abs(hash).toString(36)}_${email.replace(/[^a-z0-9]/g, '').slice(0, 8)}`;
};

const inferNameFromEmail = (email: string) => {
  const localPart = email.split('@')[0] || 'User';
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'User';
};

const readUsers = (): Record<string, MockUserSession> => {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeUsers = (users: Record<string, MockUserSession>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const saveActiveUser = (user: MockUserSession) => {
  const users = readUsers();
  users[user.email] = user;
  writeUsers(users);
  window.localStorage.setItem(ACTIVE_EMAIL_KEY, user.email);
  return user;
};

export const getCurrentUser = (): MockUserSession | null => {
  if (typeof window === 'undefined') return null;

  const activeEmail = window.localStorage.getItem(ACTIVE_EMAIL_KEY);
  if (!activeEmail) return null;

  const users = readUsers();
  return users[activeEmail] || null;
};

export const startMockLogin = (email: string, name?: string) => {
  const normalizedEmail = normalizeEmail(email);
  const users = readUsers();
  const existingUser = users[normalizedEmail];
  const now = new Date().toISOString();

  const user: MockUserSession = existingUser
    ? { ...existingUser, lastLoginAt: now }
    : {
        uid: createUid(normalizedEmail),
        email: normalizedEmail,
        name: name?.trim() || inferNameFromEmail(normalizedEmail),
        roles: [],
        createdAt: now,
        lastLoginAt: now,
      };

  return saveActiveUser(user);
};

export const registerMockUser = (name: string, email: string) => {
  return startMockLogin(email, name);
};

export const completeRoleSelection = (selection: RoleSelection) => {
  const user = getCurrentUser();
  if (!user) return null;

  const roles: UserRole[] = selection === 'both' ? ['client', 'freelancer'] : [selection];
  const activeRole: UserRole = selection === 'freelancer' ? 'freelancer' : 'client';

  return saveActiveUser({
    ...user,
    roles,
    activeRole,
  });
};

export const setActiveRole = (role: UserRole) => {
  const user = getCurrentUser();
  if (!user || !user.roles.includes(role)) return null;

  return saveActiveUser({
    ...user,
    activeRole: role,
  });
};

export const canUseRole = (role: UserRole) => {
  const user = getCurrentUser();
  return Boolean(user?.roles.includes(role));
};

export const updateCurrentUser = (updates: Partial<Pick<MockUserSession, 'name'>>) => {
  const user = getCurrentUser();
  if (!user) return null;

  return saveActiveUser({
    ...user,
    ...updates,
  });
};


export const getDefaultDashboardPath = (user = getCurrentUser()) => {
  if (!user) return '/login';
  if (!user.roles.length) return '/role-select';
  return `/dashboard/${user.activeRole || user.roles[0]}`;
};

export const logoutMockUser = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACTIVE_EMAIL_KEY);
};
