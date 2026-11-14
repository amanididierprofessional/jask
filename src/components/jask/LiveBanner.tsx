import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { coursesQuery, liveQuery } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { Avatar } from "./ui";

export function useLiveRooms() {
  const live = useQuery(liveQuery());
  const courses = useQuery(coursesQuery());
  const { userId } = useAuth();
  const byCourse = new Map<string, { id: string; full_name: string; avatar_url: string | null }[]>();
  for (const p of live.data ?? []) {
    if (!p.studying_course_id) continue;
    const arr = byCourse.get(p.studying_course_id) ?? [];
    arr.push(p);
    byCourse.set(p.studying_course_id, arr);
  }
  const rooms = [...byCourse.entries()]
    .map(([courseId, people]) => ({
      course: courses.data?.find((c) => c.id === courseId),
      people,
      others: people.filter((p) => p.id !== userId),
      joined: people.some((p) => p.id === userId),
    }))
    .filter((r) => r.course)
    .sort((a, b) => b.people.length - a.people.length);
  return { rooms, isLoading: live.isLoading || courses.isLoading };
}

export function LiveBanner() {
  const { rooms } = useLiveRooms();
  const { enrolledCourseIds } = useAuth();
  const room = rooms.find((r) => enrolledCourseIds.includes(r.course!.id) && r.others.length) ?? rooms.find((r) => r.others.length);
  if (!room) return null;
  const faces = [...room.others].sort((a, b) => Number(!!b.avatar_url) - Number(!!a.avatar_url));
  const shown = faces.slice(0, 4);
  const extra = room.others.length - shown.length;
  return (
    <section className="rounded-[28px] bg-brand p-4 text-brand-foreground">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-brand-foreground/85">
        <span className="h-2 w-2 animate-pulse rounded-full bg-win" />
        Live now
      </div>
      <p className="mt-1.5 font-display text-[20px] font-extrabold leading-snug">
        {room.others.length} {room.others.length === 1 ? "classmate" : "classmates"} studying {room.course!.code} right now
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Link to="/modules/$courseId" params={{ courseId: room.course!.id }} className="flex -space-x-2.5" aria-label="See who's studying">
          {shown.map((p) => (
            <Avatar key={p.id} name={p.full_name} url={p.avatar_url} size={36} ring="brand" />
          ))}
          {extra > 0 && (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-card text-[11px] font-bold text-brand ring-2 ring-brand">+{extra}</span>
          )}
        </Link>
        <Link
          to="/ask"
          search={{ course: room.course!.id }}
          className="flex h-11 items-center rounded-full bg-card px-5 font-display text-[14px] font-bold text-brand"
        >
          Need Help?
        </Link>
      </div>
    </section>
  );
}
