import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { notificationsQuery } from "@/lib/queries";
import { classLabel, timeAgo } from "@/lib/format";
import { Avatar, Card } from "@/components/jask/ui";

export const Route = createFileRoute("/_authenticated/me")({
  head: () => ({ meta: [{ title: "Me — Jask" }, { name: "description", content: "Your Jask profile and notifications." }] }),
  component: Me,
});

const verb = { answer: "answered your question", invite: "invited you to answer", accepted: "accepted your answer" } as Record<string, string>;

function Me() {
  const { userId, profile } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const n = useQuery(notificationsQuery(userId));
  useEffect(() => {
    if (n.data?.some((x) => !x.read)) {
      const t = setTimeout(async () => { await supabase.from("notifications").update({ read: true }).eq("user_id", userId!).eq("read", false); qc.invalidateQueries({ queryKey: ["me", "notifications"] }); }, 2000);
      return () => clearTimeout(t);
    }
  }, [n.data, userId, qc]);
  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <h1 className="px-1 text-[24px] font-black">Me</h1>
      <Card className="flex items-center gap-4">
        <Avatar name={profile?.full_name ?? ""} url={profile?.avatar_url} size={56} />
        <div className="flex-1"><p className="font-display text-[18px] font-extrabold">{profile?.full_name}</p><p className="text-[13px] text-mute">{classLabel(profile)}</p></div>
        <Link to="/onboarding" className="h-10 rounded-full border border-ink/10 px-4 pt-2.5 text-[13px] font-semibold">Edit</Link>
      </Card>
      <h2 className="px-1 text-[18px] font-black">Notifications</h2>
      {n.data?.length === 0 && <p className="px-1 text-[13px] text-mute">No notifications yet. Ask a question to get started.</p>}
      {n.data?.map((x) => (
        <Link key={x.id} to="/q/$questionId" params={{ questionId: x.question_id ?? "" }} className="flex items-center gap-3 rounded-[18px] bg-card p-3 shadow-card">
          <Avatar name={x.actor?.full_name ?? ""} url={x.actor?.avatar_url} size={36} />
          <div className="min-w-0 flex-1"><p className="text-[14px]"><b>{x.actor?.full_name}</b> {verb[x.type]}</p><p className="truncate text-[12px] text-mute">{x.question?.title} · {timeAgo(x.created_at)}</p></div>
          {!x.read && <span className="h-2 w-2 rounded-full bg-win" />}
        </Link>
      ))}
      <button onClick={async () => { await supabase.auth.signOut(); nav({ to: "/" }); }} className="mt-4 h-11 rounded-full border border-ink/10 text-[13px] font-semibold">Sign out</button>
    </div>
  );
}
