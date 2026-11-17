import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { FeedView } from '@/components/jask/FeedView';
import { CommunitiesView } from '@/components/jask/CommunitiesView';
import { BrandMark } from '@/components/jask/ui';
import { useAuth } from '@/lib/auth';
import { homeUpdatesQuery } from '@/lib/queries';
import { membershipsQuery } from '@/lib/social-queries';
import { homeUpdateCounts } from '@/lib/home-updates';
import { pageHead } from '@/lib/head';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/')({
  validateSearch: (s: Record<string, unknown>): { tab?: 'courses' | 'campus' | 'communities' } =>
    s['tab'] === 'campus' || s['tab'] === 'communities' ? { tab: s['tab'] } : {},
  head: () => pageHead('Home', 'Your courses, campus conversations and communities on Jask.'),
  component: Home,
});

function Home() {
  const { tab = 'courses' } = Route.useSearch();
  const { userId, profile, enrolledCourseIds } = useAuth();
  const updates = useQuery(homeUpdatesQuery(userId));
  const memberships = useQuery(membershipsQuery(userId));
  const counts = homeUpdateCounts(
    updates.data ?? [],
    enrolledCourseIds,
    profile?.institution_id ?? null,
    (memberships.data ?? []).map((m) => m.community_id),
  );

  const labels = {
    courses: 'My Courses',
    campus: 'Campus',
    communities: 'Communities',
  } as const;

  return (
    <>
      {/* Mobile brand */}
      <div className="flex items-center justify-between border-b px-3 py-2.5 md:hidden">
        <BrandMark />
        {!userId && (
          <Link to="/auth" className="text-sm font-bold text-brand">
            Sign in
          </Link>
        )}
      </div>

      {/* Tabs — Reddit Discover / Following style */}
      <nav aria-label="Home feeds" className="sticky top-0 z-20 flex border-b bg-background">
        {(['courses', 'campus', 'communities'] as const).map((value) => (
          <Link
            key={value}
            to="/"
            search={{ tab: value }}
            aria-current={tab === value ? 'page' : undefined}
            className={cn(
              'relative flex h-11 flex-1 items-center justify-center gap-1.5 text-[14px] font-semibold text-mute transition-colors hover:bg-muted/50',
              tab === value && 'text-ink',
            )}
          >
            {labels[value]}
            {value === 'courses' && counts.courses > 0 && (
              <span
                aria-label={`${counts.courses} unread course updates`}
                className="grid h-4 min-w-4 place-items-center rounded-full bg-win px-1 text-[10px] font-bold text-ink"
              >
                {counts.courses}
              </span>
            )}
            {value !== 'courses' && counts[value] > 0 && (
              <span aria-label={`New ${value} updates`} className="absolute right-3 top-2.5 h-1.5 w-1.5 rounded-full bg-win" />
            )}
            {tab === value && <span className="absolute inset-x-0 bottom-0 mx-auto h-0.5 w-10 rounded-full bg-brand" />}
          </Link>
        ))}
      </nav>

      {tab === 'communities' ? <CommunitiesView /> : <FeedView key={tab} mine={tab === 'courses'} />}
    </>
  );
}
