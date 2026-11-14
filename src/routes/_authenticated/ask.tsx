import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { coursesQuery, helpersQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Avatar, BackHeader, Card, EmptyState, PrimaryButton } from "@/components/jask/ui";

export const Route = createFileRoute("/_authenticated/ask")({
  validateSearch: (s: Record<string, unknown>) => ({ course: typeof s.course === "string" ? s.course : undefined }),
  head: () => ({ meta: [{ title: "Just Ask — Jask" }, { name: "description", content: "Post a question to your classmates." }] }),
  component: Ask,
});

const TAGS = ["Midterm Prep", "Problem Set", "Exam Review", "Proof Help", "Concept Check"];

function Ask() {
  const { course } = Route.useSearch();
  const { userId, profile } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const courses = useQuery(coursesQuery());
  const helpers = useQuery(helpersQuery());
  const [courseId, setCourseId] = useState(course ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [tagged, setTagged] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  if (profile && !profile.onboarded) return <div className="p-4"><BackHeader title="Just Ask" /><EmptyState title="Finish your profile first" body="Pick your university and courses so the right classmates see your question." action={<Link to="/onboarding" className="flex h-11 items-center rounded-full bg-brand px-5 font-bold text-brand-foreground">Set up profile</Link>} /></div>;
  const list = (courses.data ?? []).filter((c) => c.institution_id === profile?.institution_id);
  const peers = (helpers.data ?? []).filter((e) => e.course_id === courseId && e.user && e.user.id !== userId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return toast.error("Pick a module");
    if (title.trim().length < 8) return toast.error("Give your question a clearer title (8+ characters)");
    setBusy(true);
    const { data, error } = await supabase.from("questions").insert({ author_id: userId!, institution_id: profile?.institution_id, course_id: courseId, title: title.trim().slice(0, 200), body: body.trim().slice(0, 5000), tag }).select("id").single();
    if (error) { setBusy(false); return toast.error(error.message); }
    if (tagged.length) await supabase.from("helper_invites").insert(tagged.map((h) => ({ question_id: data.id, helper_id: h, inviter_id: userId! })));
    qc.invalidateQueries({ queryKey: ["feed"] });
    toast.success("Question published");
    nav({ to: "/q/$questionId", params: { questionId: data.id } });
  };
  const field = "w-full rounded-[18px] border border-ink/10 bg-card px-4 text-[15px] outline-none focus:border-brand";
  return (
    <div>
      <BackHeader title="Just Ask" subtitle="Your classmates are here to help" />
      <form onSubmit={submit} className="flex flex-col gap-4 px-4 pb-10 pt-2">
        <Card className="flex flex-col gap-4">
          <div><p className="mb-1.5 px-1 text-[12px] font-semibold text-mute">Module</p>
            <div className="flex flex-wrap gap-2">{list.map((c) => <button type="button" key={c.id} onClick={() => { setCourseId(c.id); setTagged([]); }} className={cn("h-9 rounded-full px-3 text-[13px] font-semibold", courseId === c.id ? "bg-brand text-brand-foreground" : "bg-brand/10 text-brand")}>{c.code} · {c.name}</button>)}</div></div>
          <label><span className="mb-1.5 block px-1 text-[12px] font-semibold text-mute">Question</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="What are you stuck on?" className={cn(field, "h-12")} /></label>
          <label><span className="mb-1.5 block px-1 text-[12px] font-semibold text-mute">Details</span><textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} rows={5} placeholder="Share what you tried, the equation, the step that breaks…" className={cn(field, "py-3")} /></label>
          <div><p className="mb-1.5 px-1 text-[12px] font-semibold text-mute">Tag (optional)</p><div className="flex flex-wrap gap-2">{TAGS.map((t) => <button type="button" key={t} onClick={() => setTag(tag === t ? null : t)} className={cn("h-9 rounded-full border px-3 text-[13px] font-semibold", tag === t ? "border-brand bg-brand/10 text-brand" : "border-ink/10")}>{t}</button>)}</div></div>
        </Card>
        {courseId && (
          <Card><p className="font-display text-[16px] font-extrabold">Tag a helper</p><p className="text-[12px] text-mute">They'll get a notification to answer.</p>
            <div className="mt-3 flex flex-col gap-2">{peers.length === 0 && <p className="text-[13px] text-mute">No classmates in this module yet.</p>}
              {peers.map((e) => { const on = tagged.includes(e.user!.id); return (
                <button type="button" key={e.user!.id} onClick={() => setTagged(on ? tagged.filter((x) => x !== e.user!.id) : [...tagged, e.user!.id])} className={cn("flex items-center gap-3 rounded-[18px] p-3 text-left", on ? "bg-brand/10" : "bg-ground")}>
                  <Avatar name={e.user!.full_name} url={e.user!.avatar_url} size={36} ring={e.status === "completed" ? "win" : undefined} />
                  <span className="flex-1 text-[14px] font-semibold">{e.user!.full_name}<span className="block text-[12px] font-normal text-mute">{e.status === "completed" ? "Completed this module" : "Taking it now"}</span></span>
                  <span className="text-[13px] font-bold text-brand">{on ? "✓ Tagged" : "Tag"}</span>
                </button>); })}</div></Card>
        )}
        <PrimaryButton type="submit" disabled={busy}>{busy ? "Publishing…" : "Just Ask"} <span className="text-[20px]">+</span></PrimaryButton>
      </form>
    </div>
  );
}
