import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { answersQuery, myBookmarksQuery, myVotesQuery, questionQuery } from "@/lib/queries";
import { useBookmark } from "@/lib/mutations";
import { classLabel, timeAgo } from "@/lib/format";
import { Avatar, BackHeader, Card, CardSkeleton, Chip, EmptyState, RichText } from "@/components/jask/ui";

export const Route = createFileRoute("/q/$questionId")({
  head: () => ({ meta: [{ title: "Discussion — Jask" }, { name: "description", content: "A campus question and its verified answers on Jask." }, { property: "og:title", content: "Discussion — Jask" }, { property: "og:description", content: "Find the people. Find the answers." }] }),
  component: Detail,
});

function Detail() {
  const { questionId } = Route.useParams();
  const { userId } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const q = useQuery(questionQuery(questionId));
  const answers = useQuery(answersQuery(questionId));
  const votes = useQuery(myVotesQuery(userId, questionId));
  const bms = useQuery(myBookmarksQuery(userId));
  const bookmark = useBookmark();
  const [text, setText] = useState("");
  const [openReplies, setOpenReplies] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const saved = !!bms.data?.some((b) => b.question_id === questionId);

  const post = useMutation({
    mutationFn: async ({ body, parent }: { body: string; parent?: string }) => {
      if (!userId) throw new Error("Sign in to answer");
      const { error } = await supabase.from("answers").insert({ question_id: questionId, author_id: userId, body: body.trim().slice(0, 5000), parent_answer_id: parent ?? null });
      if (error) throw error;
    },
    onSuccess: (_d, v) => { v.parent ? setReply("") : setText(""); qc.invalidateQueries({ queryKey: ["answers", questionId] }); qc.invalidateQueries({ queryKey: ["question", questionId] }); qc.invalidateQueries({ queryKey: ["feed"] }); toast.success(v.parent ? "Reply posted" : "Answer posted"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const vote = useMutation({
    mutationFn: async ({ id, voted }: { id: string; voted: boolean }) => {
      if (!userId) throw new Error("Sign in to vote");
      const r = voted ? await supabase.from("votes").delete().eq("user_id", userId).eq("answer_id", id) : await supabase.from("votes").insert({ user_id: userId, answer_id: id });
      if (r.error) throw r.error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["answers", questionId] }); qc.invalidateQueries({ queryKey: ["me", "votes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const accept = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("questions").update({ accepted_answer_id: id }).eq("id", questionId); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["question", questionId] }); qc.invalidateQueries({ queryKey: ["feed"] }); toast.success("Marked as accepted solution"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <div className="flex flex-col gap-4 p-4"><CardSkeleton /><CardSkeleton /></div>;
  if (!q.data) return <div className="p-4"><EmptyState title="Question not found" body="It may have been removed by its author." /></div>;
  const question = q.data;
  const all = answers.data ?? [];
  const top = all.filter((a) => !a.parent_answer_id);
  const accepted = top.find((a) => a.id === question.accepted_answer_id);
  const rest = top.filter((a) => a.id !== accepted?.id).sort((a, b) => b.upvotes - a.upvotes);
  const repliesOf = (id: string) => all.filter((a) => a.parent_answer_id === id);
  const isAuthor = userId === question.author_id;

  const Replies = ({ id }: { id: string }) => openReplies !== id ? null : (
    <div className="mt-3 flex flex-col gap-2">
      {repliesOf(id).map((r) => (
        <div key={r.id} className="flex gap-2 rounded-[18px] bg-ground p-3">
          <Avatar name={r.author?.full_name ?? ""} url={r.author?.avatar_url} size={28} />
          <div className="text-[13px]"><b>{r.author?.full_name}</b> <span className="text-mute">{timeAgo(r.created_at)}</span><RichText text={r.body} /></div>
        </div>
      ))}
      <form onSubmit={(e) => { e.preventDefault(); if (reply.trim()) post.mutate({ body: reply, parent: id }); }} className="flex gap-2">
        <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" className="h-10 flex-1 rounded-full border border-ink/10 bg-card px-4 text-[14px] outline-none" />
        <button disabled={post.isPending} className="h-10 rounded-full bg-brand px-4 text-[13px] font-bold text-brand-foreground">Reply</button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <BackHeader title="Discussion" subtitle={question.course ? `${question.course.code} • ${question.course.name}` : undefined} />
      <main className="flex flex-col gap-4 px-4 pb-28 pt-2">
        <Card>
          <div className="flex items-center gap-3">
            <Avatar name={question.author?.full_name ?? ""} url={question.author?.avatar_url} />
            <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold">{question.author?.full_name} <span className="font-normal text-mute">{classLabel(question.author)}</span></p><p className="text-[12px] text-mute">Posted {timeAgo(question.created_at)}</p></div>
            {question.tag && <Chip>{question.tag}</Chip>}
          </div>
          <p className="mt-4 font-display text-[20px] font-extrabold leading-snug">{question.title}</p>
          {question.body && <RichText text={question.body} className="mt-2 text-[15px] leading-relaxed text-ink/80" />}
          {!accepted && <button onClick={() => (userId ? bookmark.mutate({ questionId, saved }) : nav({ to: "/auth" }))} className="mt-4 h-11 rounded-full border border-ink/10 px-4 text-[13px] font-semibold">{saved ? "Saved ✓" : "Save to notes"}</button>}
        </Card>
        {accepted && (
          <Card className="ring-2 ring-win">
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-win px-4 font-display text-[13px] font-extrabold text-brand-foreground shadow-win"><Check className="h-4 w-4" strokeWidth={3} />Accepted Solution</span>
            <div className="mt-4 flex items-center gap-3"><Avatar name={accepted.author?.full_name ?? ""} url={accepted.author?.avatar_url} ring="win" /><div><p className="text-[14px] font-semibold">Verified by {accepted.author?.full_name}</p><p className="text-[12px] text-mute">{[classLabel(accepted.author), accepted.author?.role_title].filter(Boolean).join(", ")}</p></div></div>
            <RichText text={accepted.body} className="mt-3 text-[15px] leading-relaxed" />
            <div className="mt-4 flex items-center gap-2 border-t border-ink/5 pt-4">
              <button onClick={() => vote.mutate({ id: accepted.id, voted: !!votes.data?.has(accepted.id) })} className={`flex h-11 items-center gap-1.5 rounded-full px-4 text-[13px] font-bold ${votes.data?.has(accepted.id) ? "bg-brand text-brand-foreground" : "bg-brand/10 text-brand"}`}><ArrowUp className="h-4 w-4" />{accepted.upvotes}</button>
              <button onClick={() => setOpenReplies(openReplies === accepted.id ? null : accepted.id)} className="h-11 px-3 text-[13px] font-semibold text-mute">{repliesOf(accepted.id).length} replies</button>
              <button onClick={() => (userId ? bookmark.mutate({ questionId, saved }) : nav({ to: "/auth" }))} className="ml-auto h-11 rounded-full border border-ink/10 px-4 text-[13px] font-semibold">{saved ? "Saved ✓" : "Save to notes"}</button>
            </div>
            <Replies id={accepted.id} />
          </Card>
        )}
        {top.length === 0 && !answers.isLoading && <EmptyState title="No answers yet" body="Know this one? Be the first to help." />}
        {rest.map((a) => (
          <Card key={a.id}>
            <div className="flex items-center gap-3">
              <Avatar name={a.author?.full_name ?? ""} url={a.author?.avatar_url} />
              <p className="flex-1 text-[14px] font-semibold">{a.author?.full_name} <span className="font-normal text-mute">{classLabel(a.author)}</span></p>
              <button onClick={() => vote.mutate({ id: a.id, voted: !!votes.data?.has(a.id) })} className={`text-[13px] font-bold ${votes.data?.has(a.id) ? "text-win-ink" : "text-brand"}`}>▲ {a.upvotes}</button>
            </div>
            <div className="mt-3 rounded-[18px] bg-ground p-3"><RichText text={a.body} className="text-[13px] leading-snug" /></div>
            <div className="mt-2 flex items-center gap-2">
              <button onClick={() => setOpenReplies(openReplies === a.id ? null : a.id)} className="h-9 px-1 text-[13px] font-semibold text-mute">{repliesOf(a.id).length} replies</button>
              {isAuthor && <button onClick={() => accept.mutate(a.id)} className="ml-auto h-9 rounded-full bg-win/15 px-3 text-[13px] font-bold text-win-ink">Mark as accepted</button>}
            </div>
            <Replies id={a.id} />
          </Card>
        ))}
      </main>
      <form onSubmit={(e) => { e.preventDefault(); if (!userId) return nav({ to: "/auth" }); if (text.trim()) post.mutate({ body: text }); }} className="sticky bottom-0 mt-auto px-4 pb-5">
        <div className="flex h-14 items-center gap-2 rounded-full bg-card pl-5 pr-1.5 shadow-float">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} placeholder={userId ? "Write your answer…" : "Sign in to answer…"} className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-mute" />
          <button disabled={post.isPending} className="h-11 rounded-full bg-brand px-5 font-display text-[15px] font-extrabold text-brand-foreground">Answer</button>
        </div>
      </form>
    </div>
  );
}
