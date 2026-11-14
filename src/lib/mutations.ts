import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useMyInvites() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["me", "invites", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("helper_invites").select("question_id, helper_id").eq("inviter_id", userId!);
      if (error) throw error;
      return new Set(data.map((d) => `${d.question_id}:${d.helper_id}`));
    },
  });
}

export function useInvite() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, helperId }: { questionId: string; helperId: string; helperName: string }) => {
      if (!userId) throw new Error("Sign in to invite helpers");
      const { error } = await supabase.from("helper_invites").insert({ question_id: questionId, helper_id: helperId, inviter_id: userId });
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(`Invite sent to ${v.helperName}`);
      qc.invalidateQueries({ queryKey: ["me", "invites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBookmark() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, saved }: { questionId: string; saved: boolean }) => {
      if (!userId) throw new Error("Sign in to save notes");
      if (saved) {
        const { error } = await supabase.from("bookmarks").delete().eq("user_id", userId).eq("question_id", questionId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bookmarks").insert({ user_id: userId, question_id: questionId });
        if (error && error.code !== "23505") throw error;
      }
    },
    onSuccess: (_d, v) => {
      toast.success(v.saved ? "Removed from notes" : "Saved to notes");
      qc.invalidateQueries({ queryKey: ["me", "bookmarks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
