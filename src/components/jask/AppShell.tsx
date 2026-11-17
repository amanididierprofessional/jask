import { Fragment, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Home, BookMarked, User, CircleHelp, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { notificationsQuery } from '@/lib/queries';
import { communitiesQuery } from '@/lib/social-queries';
import { BrandMark, Avatar } from './ui';
import { NotificationListener } from './NotificationListener';
import { CommunityImage } from './CommunityImage';

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/notes', label: 'Notes', icon: BookMarked },
  { to: '/me', label: 'Me', icon: User },
] as const;

export function useUnread() {
  const { userId } = useAuth();
  const query = useQuery(notificationsQuery(userId));
  return query.data?.filter((notification) => !notification.read).length ?? 0;
}

function AskAction({ mobile = false, active = false }: { mobile?: boolean; active?: boolean }) {
  if (mobile) {
    return (
      <Link
        to="/ask"
        search={{ course: undefined, community: undefined }}
        aria-label="Ask a question"
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-mute transition-colors',
          active && 'text-brand',
        )}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 11.5a8 8 0 0 1-8 8H5l-2 1.5v-6A8 8 0 1 1 20 11.5Z" />
          <path d="M8 10h8M8 13.5h5" />
        </svg>
        <span className="text-[10px] font-semibold leading-none">Ask</span>
      </Link>
    );
  }

  return (
    <Link
      to="/ask"
      search={{ course: undefined, community: undefined }}
      aria-label="Ask a question"
      className={cn(
        'mt-2 flex h-10 items-center justify-center gap-2 rounded-full bg-brand px-3 text-sm font-bold text-brand-foreground',
        active && 'ring-2 ring-brand/30',
      )}
    >
      <CircleHelp className="h-4 w-4 shrink-0" />
      <span className="hidden xl:block">Ask a question</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { profile, userId } = useAuth();
  const unread = useUnread();
  const communities = useQuery(communitiesQuery());
  const bare = ['/auth', '/onboarding'].some((prefix) => path.startsWith(prefix));

  if (bare) return <div className="min-h-screen bg-background">{children}</div>;

  return (
    <div className="min-h-screen bg-background md:flex md:justify-center">
      <NotificationListener />

      {/* Left sidebar — Reddit-style */}
      <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col border-r px-2 py-4 md:flex xl:w-[240px] xl:px-3">
        <BrandMark className="mb-4 px-2" />

        <nav className="flex flex-1 flex-col gap-0.5">
          {tabs.map((tab) => (
            <Fragment key={tab.to}>
              <Link
                to={tab.to}
                title={tab.label}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-mute transition-colors hover:bg-muted hover:text-ink',
                  (tab.to === '/' ? path === '/' : path.startsWith(tab.to)) && 'bg-muted font-semibold text-ink',
                )}
              >
                <tab.icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                <span className="hidden xl:block">{tab.label}</span>
                {tab.to === '/me' && unread > 0 && (
                  <span className="ml-auto hidden rounded-full bg-win px-1.5 text-[11px] font-bold text-ink xl:inline">{unread}</span>
                )}
              </Link>
              {tab.to === '/' && <AskAction active={path.startsWith('/ask')} />}
            </Fragment>
          ))}

          <Link
            to="/"
            search={{ tab: 'communities' }}
            className={cn(
              'mt-1 flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-mute transition-colors hover:bg-muted hover:text-ink',
              path.includes('communities') && 'bg-muted font-semibold text-ink',
            )}
          >
            <Compass className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            <span className="hidden xl:block">Explore</span>
          </Link>
        </nav>

        <div className="mt-auto border-t pt-3">
          {userId ? (
            <Link to="/me" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted">
              <Avatar name={profile?.full_name ?? ''} url={profile?.avatar_url} size={28} />
              <span className="hidden truncate text-sm font-medium xl:block">{profile?.full_name}</span>
            </Link>
          ) : (
            <Link to="/auth" className="block rounded-md px-3 py-2 text-sm font-bold text-brand hover:bg-muted">
              Sign in
            </Link>
          )}
        </div>
      </aside>

      {/* Main column */}
      <main className="min-w-0 w-full border-x border-transparent md:max-w-[640px] md:flex-1 md:border-border md:pb-8">
        {children}
      </main>

      {/* Right communities panel */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 px-4 py-5 lg:block">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Communities</h2>
            <Link to="/" search={{ tab: 'communities' }} className="text-xs font-semibold text-brand hover:underline">
              See all
            </Link>
          </div>
          <div className="mt-3 space-y-1">
            {communities.data?.slice(0, 8).map((community) => (
              <Link
                key={community.id}
                to="/communities/$communityId"
                params={{ communityId: community.id }}
                className="flex items-center gap-2.5 rounded-md px-1.5 py-2 hover:bg-muted"
              >
                <CommunityImage path={community.image_path} name={community.name} size="small" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">c/{community.slug}</p>
                  <p className="text-[11px] text-mute">{community.members} members</p>
                </div>
              </Link>
            ))}
            {communities.data?.length === 0 && <p className="px-1 text-sm text-mute">No communities yet.</p>}
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      {!path.startsWith('/q/') && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t bg-card md:hidden">
          {tabs.map((tab) => (
            <Fragment key={tab.to}>
              <Link
                to={tab.to}
                aria-label={tab.label}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-mute',
                  (tab.to === '/' ? path === '/' : path.startsWith(tab.to)) && 'text-brand',
                )}
              >
                <tab.icon className="h-5 w-5" strokeWidth={1.75} />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </Link>
              {tab.to === '/' && <AskAction mobile active={path.startsWith('/ask')} />}
            </Fragment>
          ))}
        </nav>
      )}
    </div>
  );
}
