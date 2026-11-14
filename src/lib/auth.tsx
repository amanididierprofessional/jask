import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;

type AuthCtx = {
  session: Session | null;
  userId: string | null;
  ready: boolean;
  profile: Profile | null | undefined;
  enrolledCourseIds: string[];
};

const Ctx = createContext<AuthCtx>({ session: null, userId: null, ready: false, profile: undefined, enrolledCourseIds: [] });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        if (event === "SIGNED_OUT") qc.removeQueries({ queryKey: ["me"] });
        else qc.invalidateQueries();
      }
    });
    supabase.auth.getSession().then(({ data: d }) => {
      setSession(d.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);

  const userId = session?.user.id ?? null;
  const profileQ = useQuery({
    queryKey: ["me", "profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const enrollQ = useQuery({
    queryKey: ["me", "enrollments", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("enrollments").select("course_id, status").eq("user_id", userId!);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Ctx.Provider
      value={{
        session,
        userId,
        ready,
        profile: userId ? profileQ.data : null,
        enrolledCourseIds: (enrollQ.data ?? []).map((e) => e.course_id),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
