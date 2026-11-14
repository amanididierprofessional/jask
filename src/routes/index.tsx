import { useDeferredValue, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { coursesQuery, feedQuery, helpersQuery } from "@/lib/queries";
import { Avatar, BrandMark, CardSkeleton, EmptyState } from "@/components/jask/ui";
import { LiveBanner } from "@/components/jask/LiveBanner";
import { QuestionCard } from "@/components/jask/QuestionCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Feed — Jask" },
      { name: "description", content: "Questions from your classmates in Linear Algebra, Algorithms, Discrete Math and more. Just Ask." },
      { property: "og:title", content: "Campus Feed — Jask" },
      { property: "og:description", content: "Find the people. Find the answers. Your campus study feed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Feed,
});

type Scope = "all" | "mine" | string;

function Feed() {
  const { userId, profile, enrolledCourseIds } = useAuth();
  const [scope, setScope] = useState<Scope>("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const deferred = useDeferredValue(search);
  const courses = useQuery(coursesQuery());
  const institutionId = profile?.institution_id ?? null;
  const campusCourses = (courses.data ?? []).filter((c) => !institutionId || c.institution_id === institutionId);

  const courseIds = scope === "all" ? null : scope === "mine" ? enrolledCourseIds : [scope];
  const feed = useQuery(feedQuery({ courseIds, search: deferred, institutionId }));
  const helpers = useQuery(helpersQuery());

  // Recommend one classmate who completed the module, only for unaccepted-or-singular threads so cards alternate like the design
  const helperFor = useMemo(() => {
    const completed = (helpers.data ?? []).filter((e) => e.status === "completed" && e.user);
    return (courseId: string, authorId: string | undefined, idx: number) => {
      if (idx % 2 === 0) return null;
      const h = completed.find((e) => e.course_id === courseId && e.user!.id !== authorId && e.user!.id !== userId);
      return h?.user ?? null;
    };
  }, [helpers.data, userId]);

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between px-5 pb-3 pt-4">
        <div>
          <BrandMark className="md:hidden" />
          <h1 className="mt-1 text-[24px] font-black leading-tight">Campus Feed</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Search questions"
            onClick={() => setSearchOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-full bg-card text-ink shadow-card"
          >
            {searchOpen ? <X className="h-[18px] w-[18px]" /> : <Search className="h-[18px] w-[18px]" />}
          </button>
          {userId ? (
            <Link to="/me" className="md:hidden" aria-label="Your profile">
              <Avatar name={profile?.full_name ?? "Me"} url={profile?.avatar_url} ring="white" />
            </Link>
          ) : (
            <Link to="/auth" className="flex h-10 items-center rounded-full bg-brand px-4 font-display text-[13px] font-extrabold text-brand-foreground">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="flex flex-col gap-4 px-4 pb-28 md:pb-8">
        {searchOpen && (
          <label className="flex h-12 items-center gap-2 rounded-[18px] border border-ink/10 bg-card px-4">
            <Search className="h-4 w-4 text-mute" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions"
              className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-mute"
            />
          </label>
        )}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <FilterPill active={scope === "all"} onClick={() => setScope("all")}>
            All campus
          </FilterPill>
          {userId && (
            <FilterPill active={scope === "mine"} onClick={() => setScope("mine")}>
              My courses
            </FilterPill>
          )}
          {campusCourses.map((c) => (
            <FilterPill key={c.id} active={scope === c.id} onClick={() => setScope(c.id)}>
              {c.name}
            </FilterPill>
          ))}
        </div>

        {scope === "all" && !deferred && <LiveBanner />}

        {userId && profile && !profile.onboarded && (
          <Link to="/onboarding" className="flex items-center gap-3 rounded-[18px] bg-card p-3 shadow-card">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 font-display text-[13px] font-black text-brand">✓</span>
            <div className="flex-1">
              <p className="text-[14px] font-semibold">Finish your profile</p>
              <p className="text-[12px] text-mute">Add your university and courses to see relevant questions</p>
            </div>
          </Link>
        )}

        {feed.isLoading && (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        )}
        {feed.isError && <EmptyState title="Couldn't load the feed" body="Check your connection and try again." action={<button onClick={() => feed.refetch()} className="h-11 rounded-full border border-ink/10 px-4 text-[13px] font-semibold">Try again</button>} />}
        {feed.data?.length === 0 &&
          (scope === "mine" && enrolledCourseIds.length === 0 ? (
            <EmptyState
              title="No courses yet"
              body="Add the modules you're taking to see questions from your classmates."
              action={
                <Link to="/onboarding" className="flex h-11 items-center rounded-full bg-brand px-5 font-display text-[14px] font-bold text-brand-foreground">
                  Add courses
                </Link>
              }
            />
          ) : (
            <EmptyState
              title={deferred ? "No matching questions" : "No questions here yet"}
              body={deferred ? "Try another word, or ask it yourself." : "Be the first to ask — someone in your class is wondering too."}
            />
          ))}
        {feed.data?.map((q, i) => (
          <QuestionCard key={q.id} q={q} helper={helperFor(q.course_id, q.author?.id, i)} />
        ))}
      </main>

      <div className="fixed inset-x-4 bottom-[92px] z-20 md:sticky md:inset-x-auto md:bottom-5 md:mx-4 md:mb-5">
        <Link
          to="/ask"
          search={{ course: typeof scope === "string" && scope !== "all" && scope !== "mine" ? scope : undefined }}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand font-display text-[16px] font-extrabold text-brand-foreground shadow-brand"
        >
          Just Ask a Question <span className="text-[20px]">+</span>
        </Link>
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition",
        active ? "bg-brand text-brand-foreground" : "bg-card text-ink shadow-card",
      )}
    >
      {children}
    </button>
  );
}
