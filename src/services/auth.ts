const AUTH_KEY = "resumexpert_auth";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

function getState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore parse errors, return default state
  }
  return { user: null, isAuthenticated: false };
}

function setState(state: AuthState) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export function getUser(): User | null {
  return getState().user;
}

export function isAuthenticated(): boolean {
  return getState().isAuthenticated;
}

export function signup(name: string, email: string, _password: string): User {
  const user: User = { id: crypto.randomUUID(), name, email };
  setState({ user, isAuthenticated: true });
  return user;
}

export function login(email: string, _password: string): User {
  const user: User = { id: crypto.randomUUID(), name: email.split("@")[0], email };
  setState({ user, isAuthenticated: true });
  return user;
}

export function logout() {
  setState({ user: null, isAuthenticated: false });
}
