import axios from "axios";
import type { AuthSession, RecruiterUser } from "@/types";
import { getApiBase } from "@/lib/apiBase";
import { getSupabase, isSupabaseAuthConfigured } from "@/lib/supabase";

const SESSION_KEY = "ai-recruit-auth-session";
const PROFILE_FETCH_TIMEOUT_MS = 8000;
const SESSION_RESTORE_TIMEOUT_MS = 5000;

export function isUsingSupabaseAuth(): boolean {
  return isSupabaseAuthConfigured();
}

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession, remember = true) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
  if (remember) {
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function getAuthToken(): string | null {
  return getStoredSession()?.token ?? null;
}

async function fetchRecruiterProfile(
  token: string,
  timeoutMs = PROFILE_FETCH_TIMEOUT_MS
): Promise<RecruiterUser> {
  const { data } = await axios.get(`${getApiBase()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: timeoutMs,
  });
  return data.user as RecruiterUser;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);
}

export async function loginRecruiter(
  email: string,
  password: string,
  remember = true
): Promise<AuthSession> {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new Error(error.message || "Invalid email or password.");
    }

    if (!data.session?.access_token) {
      throw new Error("Supabase did not return a valid session.");
    }

    const user = await fetchRecruiterProfile(data.session.access_token);
    const session: AuthSession = {
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user,
      expiresInHours: Math.max(1, Math.round((data.session.expires_in ?? 3600) / 3600)),
      loggedInAt: new Date().toISOString(),
      provider: "supabase",
    };

    saveSession(session, remember);
    return session;
  }

  const { data } = await axios.post(
    `${getApiBase()}/auth/login`,
    { email, password },
    { timeout: 30000 }
  );

  const session: AuthSession = {
    token: data.token,
    user: data.user as RecruiterUser,
    expiresInHours: data.expires_in_hours ?? 24,
    loggedInAt: new Date().toISOString(),
    provider: (data.provider as AuthSession["provider"]) ?? "local",
  };

  saveSession(session, remember);
  return session;
}

export async function fetchCurrentRecruiter(): Promise<RecruiterUser | null> {
  const supabase = getSupabase();

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      clearSession();
      return null;
    }

    try {
      const user = await withTimeout(
        fetchRecruiterProfile(accessToken),
        PROFILE_FETCH_TIMEOUT_MS
      );
      if (!user) {
        clearSession();
        await supabase.auth.signOut().catch(() => {});
        return null;
      }
      const existing = getStoredSession();
      saveSession(
        {
          token: accessToken,
          refreshToken: data.session?.refresh_token,
          user,
          expiresInHours: existing?.expiresInHours ?? 24,
          loggedInAt: existing?.loggedInAt ?? new Date().toISOString(),
          provider: "supabase",
        },
        Boolean(localStorage.getItem(SESSION_KEY))
      );
      return user;
    } catch {
      clearSession();
      await supabase.auth.signOut();
      return null;
    }
  }

  const token = getAuthToken();
  if (!token) return null;

  try {
    const user = await withTimeout(fetchRecruiterProfile(token), PROFILE_FETCH_TIMEOUT_MS);
    if (!user) {
      clearSession();
      return null;
    }
    return user;
  } catch {
    clearSession();
    return null;
  }
}

export async function restoreRecruiterSession(): Promise<RecruiterUser | null> {
  const user = await withTimeout(fetchCurrentRecruiter(), SESSION_RESTORE_TIMEOUT_MS);
  if (!user) {
    clearSession();
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
  }
  return user;
}

export async function logoutRecruiter() {
  const supabase = getSupabase();

  try {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      const token = getAuthToken();
      if (token) {
        await axios.post(
          `${getApiBase()}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
        );
      }
    }
  } catch {
    /* ignore network errors on logout */
  } finally {
    clearSession();
  }
}
