import { authenticatedUsers } from './const';

export const userAuthentication = (userId: string) => {
  if (authenticatedUsers.includes(userId)) {
    return;
  }
  throw new Error('unauthorized');
};
