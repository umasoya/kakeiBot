import { AuthenticatedUsers } from './const';

export const userAuthentication = (userId: string) => {
  if (AuthenticatedUsers.includes(userId)) {
    return;
  }
  throw new Error('unauthorized');
};
