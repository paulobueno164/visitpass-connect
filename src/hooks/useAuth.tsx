import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "analyst" | "citizen";

interface AuthState {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
}

type AuthContextValue = AuthState & {
  isAnalyst: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

let cachedAuthState: AuthState | null = null;

function getInitialAuthState(): AuthState {
  if (cachedAuthState && cachedAuthState.loading === false) {
    return cachedAuthState;
  }
  return { user: null, roles: [], loading: true };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(getInitialAuthState);

  const setAuthState = (next: AuthState) => {
    if (next.loading === false) cachedAuthState = next;
    setState(next);
  };

  useEffect(() => {
    const fetchRoles = async (userId: string) => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      return (data || []).map((r) => r.role as AppRole);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        setAuthState({ user: null, roles: [], loading: false });
      } else {
        try {
          const roles = await fetchRoles(session.user.id);
          setAuthState({ user: session.user, roles, loading: false });
        } catch {
          setAuthState({ user: session.user, roles: [], loading: false });
        }
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setAuthState({ user: null, roles: [], loading: false });
      } else {
        try {
          const roles = await fetchRoles(session.user.id);
          setAuthState({ user: session.user, roles, loading: false });
        } catch (err) {
          setAuthState({ user: session.user, roles: [], loading: false });
        }
      }
    }).catch(() => {
      setAuthState({ user: null, roles: [], loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAnalyst = state.roles.includes("analyst") || state.roles.includes("admin");
  const isAdmin = state.roles.includes("admin");

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextValue = { ...state, isAnalyst, isAdmin, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(requireAuth = true) {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  if (!auth) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  useEffect(() => {
    if (!auth.loading && !auth.user && requireAuth) {
      navigate("/auth");
    }
  }, [auth.loading, auth.user, requireAuth, navigate]);

  return {
    ...auth,
    logout: async () => {
      await auth.logout();
      navigate("/auth");
    },
  };
}
