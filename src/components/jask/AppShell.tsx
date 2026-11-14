import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Home, LibraryBig, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { notificationsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useLiveRooms } from "./LiveBanner";
import { Avatar, BrandMark } from "./ui";

const BARE = ["/auth", "/onboarding"];

export function useUnread() {
  const { userId } = useAuth();
  const n = useQuery(notificationsQuery(userId));
  return (n.data ?? []).filter((x) => !x.read).length;
}

const tabs = [
  { to: "/", label: "Feed", icon: Home },
  { to: "/modules", label: "Modules", icon: LibraryBig },
  { to: "/notes", label: "Notes", icon: BookMarked },
  { to: "/me", label: "Me", icon: User },
] as const;

function isActive(path: string, to: string) {
  return to === "/" ? path === "/" : path.startsWith(to);
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (BARE.some((b) => path.startsWith(b))) return <div className="min-h-screen bg-ground">{children}</div>;
  const hideTabs = path.startsWith("/q/") || path.startsWith("/ask");
  return (
    <div className="min-h-screen bg-ground md:flex md:justify-center">
      <SideNav path={path} />
      <main className={cn("relative w-full md:max-w-[640px] md:flex-1", hideTabs ? "" : "pb-24 md:pb-8")}>{children}</main>
      <StudyRoomsPanel />
      {!hideTabs && <TabBar path={path} />}
    </div>
  );
}

function TabBar({ path }: { path: string }) {
  const unread = useUnread();
  return (
    <nav className="fixed bottom-5 left-5 right-5 z-30 flex h-[58px] items-center justify-around rounded-full border border-ink/5 bg-card px-2 shadow-float md:hidden">
      {tabs.slice(0, 2).map((t) => (
        <TabLink key={t.to} t={t} active={isActive(path, t.to)} />
      ))}
      <Link
        to="/ask"
        search={{ course: undefined }}
        aria-label="Ask"
        className="grid h-11 w-11 place-items-center rounded-full bg-brand text-brand-foreground shadow-brand"
      >
        <Plus className="h-[22px] w-[22px]" strokeWidth={2.5} />
      </Link>
      {tabs.slice(2).map((t) => (
        <TabLink key={t.to} t={t} active={isActive(path, t.to)} dot={t.to === "/me" && unread > 0} />
      ))}
    </nav>
  );
}

function TabLink({ t, active, dot }: { t: (typeof tabs)[number]; active: boolean; dot?: boolean }) {
  const Icon = t.icon;
  return (
    <Link
      to={t.to}
      className={cn(
        "relative flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 font-display text-[13px] font-bold text-mute",
        active && "bg-brand/10 text-brand",
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
      {active && t.label}
      {dot && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-win ring-2 ring-card" />}
    </Link>
  );
}

function SideNav({ path }: { path: string }) {
  const { profile, userId } = useAuth();
  const unread = useUnread();
  return (
    <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col gap-2 px-3 py-6 md:flex xl:w-60">
      <div className="px-2 pb-4">
        <BrandMark className="text-[18px] [&>span]:h-7 [&>span]:w-7 [&>span]:text-[14px]" />
      </div>
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = isActive(path, t.to);
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "relative flex h-12 items-center justify-center gap-3 rounded-full px-3 font-display text-[15px] font-bold text-mute transition hover:bg-card xl:justify-start xl:px-4",
              active && "bg-brand/10 text-brand hover:bg-brand/10",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="hidden xl:inline">{t.label}</span>
            {t.to === "/me" && unread > 0 && (
              <span className="absolute right-3 top-3 grid h-5 min-w-5 place-items-center rounded-full bg-win px-1 text-[11px] text-brand-foreground xl:static xl:ml-auto">
                {unread}
              </span>
            )}
          </Link>
        );
      })}
      <Link
        to="/ask"
        search={{ course: undefined }}
        className="mt-3 flex h-12 items-center justify-center gap-2 rounded-full bg-brand font-display text-[15px] font-extrabold text-brand-foreground shadow-brand"
        aria-label="Just Ask a Question"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        <span className="hidden xl:inline">Just Ask</span>
      </Link>
      <div className="mt-auto">
        {userId ? (
          <Link to="/me" className="flex items-center justify-center gap-3 rounded-full p-1.5 hover:bg-card xl:justify-start">
            <Avatar name={profile?.full_name ?? "Me"} url={profile?.avatar_url} size={36} ring="white" />
            <span className="hidden truncate text-[14px] font-semibold xl:inline">{profile?.full_name}</span>
          </Link>
        ) : (
          <Link to="/auth" className="flex h-11 items-center justify-center rounded-full border border-ink/10 text-[13px] font-semibold">
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}

export function useStudyToggle() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, join }: { courseId: string; join: boolean }) => {
      if (!userId) throw new Error("Sign in to join a study room");
      const { error } = await supabase
        .from("profiles")
        .update(
          join
            ? { studying_course_id: courseId, studying_until: new Date(Date.now() + 2 * 3600_000).toISOString() }
            : { studying_course_id: null, studying_until: null },
        )
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.join ? "You're in the study room for the next 2 hours" : "You left the study room");
      qc.invalidateQueries({ queryKey: ["live"] });
      qc.invalidateQueries({ queryKey: ["me", "profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

function StudyRoomsPanel() {
  const { rooms, isLoading } = useLiveRooms();
  const toggle = useStudyToggle();
  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 overflow-y-auto px-4 py-6 lg:block">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[18px] font-black">Study rooms</h2>
        <Link to="/modules" className="text-[13px] font-bold text-brand">
          All modules
        </Link>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {isLoading && <div className="h-[60px] animate-pulse rounded-[18px] bg-card" />}
        {!isLoading && rooms.length === 0 && (
          <p className="rounded-[18px] bg-card p-4 text-[13px] text-mute">Nobody is studying right now. Open a module and start a room.</p>
        )}
        {rooms.map((r) => (
          <div key={r.course!.id} className="rounded-[22px] bg-card p-3 shadow-card">
            <Link to="/modules/$courseId" params={{ courseId: r.course!.id }} className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 font-display text-[12px] font-black text-brand">
                {r.people.length}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{r.course!.name}</p>
                <p className="flex items-center gap-1.5 text-[12px] text-mute">
                  <span className="h-1.5 w-1.5 rounded-full bg-win" /> {r.course!.code} · studying now
                </p>
              </div>
            </Link>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex -space-x-2">
                {r.people.slice(0, 5).map((p) => (
                  <Avatar key={p.id} name={p.full_name} url={p.avatar_url} size={26} ring="white" />
                ))}
              </div>
              <button
                type="button"
                disabled={toggle.isPending}
                onClick={() => toggle.mutate({ courseId: r.course!.id, join: !r.joined })}
                className={cn(
                  "h-8 rounded-full px-3 text-[12px] font-bold",
                  r.joined ? "border border-ink/10 text-mute" : "bg-brand/10 text-brand",
                )}
              >
                {r.joined ? "Leave" : "Join"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
