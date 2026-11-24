import { Fragment, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Home, BookMarked, User, CircleHelp, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { notificationsQuery } from '@/lib/queries';
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
          'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[#878A8C] transition-colors',
          active && 'text-[#FF4500]',
        )}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 shrink-0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
        'mt-2 flex h-10 items-center justify-center gap-2 rounded-full bg-[#FF4500] px-4 text-sm font-bold text-white transition-colors hover:bg-[#FF5414]',
        active && 'ring-2 ring-[#FF4500]/25',
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
  const bare = ['/auth', '/onboarding'].some((prefix) => path.startsWith(prefix));

  if (bare) return <div className="min-h-screen bg-white">{children}</div>;

  return (
    <div className="min-h-screen bg-white md:flex md:justify-center">
      <NotificationListener />

      {/* Left sidebar — ChatGPT / X style */}
      <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col border-r border-[#EDEFF1] bg-white px-2 py-3 md:flex xl:w-[260px] xl:px-3">
        {/* Logo */}
        <div className="mb-4 px-2">
          <BrandMark />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {tabs.map((tab) => {
            const isActive = tab.to === '/' ? path === '/' : path.startsWith(tab.to);
            return (
              <Fragment key={tab.to}>
                <Link
                  to={tab.to}
                  title={tab.label}
                  className={cn(
                    // ChatGPT + X style hover
                    'group flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium text-[#1A1A1B] transition-all duration-150',
                    'hover:bg-[#F0F0F0]',
                    isActive && 'bg-[#F0F0F0] font-semibold',
                  )}
                >
                  <tab.icon
                    className={cn(
                      'h-[22px] w-[22px] shrink-0 transition-colors',
                      isActive ? 'text-[#1A1A1B]' : 'text-[#536471] group-hover:text-[#1A1A1B]',
                    )}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span className="hidden xl:block">{tab.label}</span>
                  {tab.to === '/me' && unread > 0 && (
                    <span className="ml-auto hidden rounded-full bg-[#FF4500] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white xl:inline">
                      {unread}
                    </span>
                  )}
                </Link>
                {tab.to === '/' && <AskAction active={path.startsWith('/ask')} />}
              </Fragment>
            );
          })}

          <Link
            to="/"
            search={{ tab: 'communities' }}
            className={cn(
              'group mt-1 flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium text-[#1A1A1B] transition-all duration-150',
              'hover:bg-[#F0F0F0]',
              path.includes('communities') && 'bg-[#F0F0F0] font-semibold',
            )}
          >
            <Compass
              className={cn(
                'h-[22px] w-[22px] shrink-0 transition-colors',
                path.includes('communities')
                  ? 'text-[#1A1A1B]'
                  : 'text-[#536471] group-hover:text-[#1A1A1B]',
              )}
              strokeWidth={path.includes('communities') ? 2.2 : 1.8}
            />
            <span className="hidden xl:block">Explore</span>
          </Link>
        </nav>

        {/* User / Login at bottom */}
        <div className="mt-auto border-t border-[#EDEFF1] pt-3">
          {userId ? (
            <Link
              to="/me"
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[#F0F0F0]"
            >
              <Avatar name={profile?.full_name ?? ''} url={profile?.avatar_url} size={32} />
              <span className="hidden truncate text-[15px] font-medium text-[#1A1A1B] xl:block">
                {profile?.full_name}
              </span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="block rounded-full border border-[#1A1A1B] px-4 py-2 text-center text-sm font-bold text-[#1A1A1B] transition-colors hover:bg-[#F0F0F0]"
            >
              Log In
            </Link>
          )}
        </div>
      </aside>

      {/* Main column — clean centered feed (Instagram desktop feel) */}
      <main className="min-w-0 w-full max-w-[640px] flex-1 bg-white md:border-x md:border-[#EDEFF1] md:pb-8">
        {children}
      </main>

      {/* Empty right space for balance on large screens (no communities card) */}
      <div className="hidden w-[72px] shrink-0 xl:block xl:w-[260px]" aria-hidden="true" />

      {/* Mobile bottom nav */}
      {!path.startsWith('/q/') && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-[#EDEFF1] bg-white md:hidden">
          {tabs.map((tab) => (
            <Fragment key={tab.to}>
              <Link
                to={tab.to}
                aria-label={tab.label}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[#878A8C]',
                  (tab.to === '/' ? path === '/' : path.startsWith(tab.to)) && 'text-[#FF4500]',
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
