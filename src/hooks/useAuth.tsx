import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "analyst" | "citizen";

interface AuthState {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
}

export function useAuth(requireAuth = true) {
  const [state, setState] = useState<AuthState>({ user: null, roles: [], loading: true });
  const navigate = useNavigate();

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
        setState({ user: null, roles: [], loading: false });
        if (requireAuth) navigate("/auth");
      } else {
        const roles = await fetchRoles(session.user.id);
        setState({ user: session.user, roles, loading: false });
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setState({ user: null, roles: [], loading: false });
        if (requireAuth) navigate("/auth");
      } else {
        const roles = await fetchRoles(session.user.id);
        setState({ user: session.user, roles, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, requireAuth]);

  const isAnalyst = state.roles.includes("analyst") || state.roles.includes("admin");
  const isAdmin = state.roles.includes("admin");

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return { ...state, isAnalyst, isAdmin, logout };
}
