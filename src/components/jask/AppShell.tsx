import { Fragment, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Home, Users, BookMarked, User, CircleHelp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { notificationsQuery } from '@/lib/queries';
import { communitiesQuery } from '@/lib/social-queries';
import { BrandMark, Avatar } from './ui';
import { NotificationListener } from './NotificationListener';

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
          <path d="M20 11.2a7.2 7.2 0 0 1-7.2 7.2H6l-3 2v-6.2a7.2 7.2 0 1 1 17  -3Z" />
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
        'flex h-12 items-center gap-3 rounded-full bg-brand px-3 text-sm font-bold text-brand-foreground shadow-brand',
        active && 'ring-2 ring-brand/30',
      )}
    >
      <CircleHelp className="h-5 w-5 shrink-0" />
      <span className="hidden xl:block">Ask</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { profile, userId } = useAuth();
  const unread = useUnread();
  const communities = useQuery(communitiesQuery());
  const bare = ['/auth', '/onboarding'].some((prefix) => path.startsWith(prefix));

  if (bare) return <div className="min-h-screen bg-ground">{children}</div>;

  return (
    <div className="min-h-screen bg-ground md:flex md:justify-center">
      <NotificationListener />
      <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col gap-2 px-3 py-6 md:flex xl:w-56">
        <BrandMark className="mb-5 px-2" />
        {tabs.map((tab) => (
          <Fragment key={tab.to}>
            <Link
              to={tab.to}
              title={tab.label}
              className={cn(
                'flex h-12 items-center gap-3 rounded-full px-3 text-sm font-bold text-mute',
                (tab.to === '/' ? path === '/' : path.startsWith(tab.to)) && 'bg-secondary text-brand',
              )}
            >
              <tab.icon className="h-5 w-5 shrink-0" />
              <span className="hidden xl:block">{tab.label}</span>
              {tab.to === '/me' && unread > 0 && <span className="text-xs text-win">{unread}</span>}
            </Link>
            {tab.to === '/' && <AskAction active={path.startsWith('/ask')} />}
          </Fragment>
        ))}
        <div className="mt-auto">
          {userId ? (
            <Link to="/me" className="flex items-center gap-2">
              <Avatar name={profile?.full_name ?? ''} url={profile?.avatar_url} size={32} />
              <span className="hidden truncate text-sm xl:block">{profile?.full_name}</span>
            </Link>
          ) : (
            <Link to="/auth" className="text-sm font-bold text-brand">Sign in</Link>
          )}
        </div>
      </aside>

      <main className="min-w-0 w-full pb-24 md:max-w-[640px] md:flex-1 md:pb-8">{children}</main>

      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 px-5 py-6 lg:block">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Communities</h2>
          <Link to="/" search={{ tab: 'communities' }} className="text-xs font-semibold text-brand">Explore</Link>
        </div>
        <div className="mt-5 space-y-5">
          {communities.data?.slice(0, 8).map((community) => (
            <Link
              key={community.id}
              to="/communities/$communityId"
              params={{ communityId: community.id }}
              className="flex items-center gap-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-brand">
                <Users className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">c/{community.slug}</p>
                <p className="text-xs text-mute">{community.members} members · {community.posts} posts</p>
              </div>
            </Link>
          ))}
          {communities.data?.length === 0 && <p className="text-sm text-mute">No communities yet.</p>}
        </div>
      </aside>

      {!path.startsWith('/q/') && (
        <nav className="fixed bottom-4 left-3 right-3 z-30 flex h-16 items-center justify-around rounded-full border bg-card px-1 shadow-float md:hidden">
          {tabs.map((tab) => (
            <Fragment key={tab.to}>
              <Link
                to={tab.to}
                aria-label={tab.label}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-mute',
                  (tab.to === '/' ? path === '/' : path.startsWith(tab.to)) && 'text-brand',
                )}
              >
                <tab.icon className="h-5 w-5" />
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
