import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { coursesQuery, feedQuery, helpersQuery } from "@/lib/queries";
import { classLabel } from "@/lib/format";
import { Avatar, BackHeader, Card, EmptyState } from "@/components/jask/ui";
import { QuestionCard } from "@/components/jask/QuestionCard";
import { useLiveRooms } from "@/components/jask/LiveBanner";
import { useStudyToggle } from "@/components/jask/AppShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/modules/$courseId")({
  head: () => ({ meta: [{ title: "Module — Jask" }, { name: "description", content: "Questions and classmates for this module." }] }),
  component: Module,
});

function Module() {
  const { courseId } = Route.useParams();
  const { userId } = useAuth();
  const course = useQuery(coursesQuery()).data?.find((c) => c.id === courseId);
  const feed = useQuery(feedQuery({ courseIds: [courseId] }));
  const peers = (useQuery(helpersQuery()).data ?? []).filter((e) => e.course_id === courseId && e.user);
  const room = useLiveRooms().rooms.find((r) => r.course?.id === courseId);
  const toggle = useStudyToggle();
  return (
    <div>
      <BackHeader title={course?.name ?? "Module"} subtitle={course?.code} />
      <main className="flex flex-col gap-4 px-4 pt-2">
        <Card>
          <p className="text-[14px] text-mute">{course?.description}</p>
          <p className="mt-3 text-[13px] font-semibold"><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-win" />{room?.people.length ?? 0} studying now</p>
          {userId && <button onClick={() => toggle.mutate({ courseId, join: !room?.joined })} className="mt-3 h-11 rounded-full bg-brand px-5 font-display text-[14px] font-bold text-brand-foreground">{room?.joined ? "Leave study room" : "I'm studying this now"}</button>}
        </Card>
        <h2 className="px-1 text-[18px] font-black">Classmates</h2>
        <div className="flex flex-col gap-2">
          {peers.length === 0 && <p className="px-1 text-[13px] text-mute">No one has joined this module yet.</p>}
          {peers.map((e) => (
            <div key={e.user!.id} className="flex items-center gap-3 rounded-[18px] bg-card p-3 shadow-card">
              <Avatar name={e.user!.full_name} url={e.user!.avatar_url} size={36} ring={e.status === "completed" ? "win" : undefined} />
              <div className="flex-1"><p className="text-[14px] font-semibold">{e.user!.full_name}</p><p className="text-[12px] text-mute">{classLabel(e.user)} · {e.status === "completed" ? "Completed this module" : "Taking it now"}</p></div>
            </div>
          ))}
        </div>
        <h2 className="px-1 text-[18px] font-black">Questions</h2>
        {feed.data?.length === 0 && <EmptyState title="No questions yet" body="Be the first to ask in this module." />}
        {feed.data?.map((q) => <QuestionCard key={q.id} q={q} />)}
      </main>
    </div>
  );
}
