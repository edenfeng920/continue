// authStatus.ts
export let isLoggedIn = false;

const subscribers = new Set<() => void>();

export const login = () => {
  isLoggedIn = true;
  subscribers.forEach((callback) => callback());
};

export const logout = () => {
  isLoggedIn = false;
  subscribers.forEach((callback) => callback());
};

export const subscribeToAuthChanges = (callback: () => void) => {
  subscribers.add(callback);
};

export const unsubscribeFromAuthChanges = (callback: () => void) => {
  subscribers.delete(callback);
};
