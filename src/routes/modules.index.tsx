import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { coursesQuery } from "@/lib/queries";
import { useLiveRooms } from "@/components/jask/LiveBanner";

export const Route = createFileRoute("/modules/")({
  head: () => ({ meta: [{ title: "Modules — Jask" }, { name: "description", content: "Browse campus modules and the classmates who know them." }] }),
  component: Modules,
});

function Modules() {
  const courses = useQuery(coursesQuery());
  const { rooms } = useLiveRooms();
  const [s, setS] = useState("");
  const list = (courses.data ?? []).filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(s.toLowerCase()));
  return (
    <div className="px-4 pt-4">
      <h1 className="px-1 text-[24px] font-black">Modules</h1>
      <input value={s} onChange={(e) => setS(e.target.value)} placeholder="Search modules" className="mt-3 h-12 w-full rounded-[18px] border border-ink/10 bg-card px-4 text-[15px] outline-none" />
      <div className="mt-4 flex flex-col gap-2">
        {list.map((c) => {
          const live = rooms.find((r) => r.course?.id === c.id)?.people.length ?? 0;
          return (
            <Link key={c.id} to="/modules/$courseId" params={{ courseId: c.id }} className="flex min-h-[60px] items-center gap-3 rounded-[18px] bg-card p-3 shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 font-display text-[11px] font-black text-brand">{c.code.split(" ")[1] ?? c.code}</span>
              <div className="flex-1"><p className="text-[14px] font-semibold">{c.name}</p><p className="text-[12px] text-mute">{c.code}{live ? ` · ${live} studying now` : ""}</p></div>
              <ChevronRight className="h-[18px] w-[18px] text-mute" />
            </Link>
          );
        })}
        {list.length === 0 && !courses.isLoading && <p className="p-4 text-center text-[13px] text-mute">No modules match.</p>}
      </div>
    </div>
  );
}
