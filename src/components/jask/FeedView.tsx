import { useDeferredValue, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { feedQuery, coursesQuery } from '@/lib/queries';
import { communitiesQuery } from '@/lib/social-queries';
import { CardSkeleton, EmptyState } from './ui';
import { QuestionCard } from './QuestionCard';
import { cn } from '@/lib/utils';

export function FeedView({
  mine = false,
  communityId,
}: {
  mine?: boolean;
  communityId?: string;
}) {
  const { userId, profile, enrolledCourseIds } = useAuth();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('hot');
  const deferred = useDeferredValue(search);
  const courses = useQuery(coursesQuery());
  const communities = useQuery(communitiesQuery());
  const feed = useQuery(
    feedQuery({
      courseIds: mine ? enrolledCourseIds : null,
      institutionId: communityId ? null : profile?.institution_id,
      communityId,
      search: deferred,
      sort,
    }),
  );
  const trending = communities.data?.find(
    (c) => c.activity > 0 && (!profile?.institution_id || c.institution_id === profile.institution_id),
  );

  return (
    <div className="pb-20 md:pb-6">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-3 py-2 backdrop-blur sm:px-4">
        <div className="flex items-center gap-2 rounded-full border bg-muted/50 px-3 transition-colors focus-within:border-brand/40 focus-within:bg-card">
          <Search className="h-4 w-4 shrink-0 text-mute" />
          <input
            aria-label="Search questions"
            placeholder="Search questions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-mute"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 border-b px-3 py-2 sm:px-4">
        {(['hot', 'new', 'top'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setSort(v)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors',
              sort === v ? 'bg-muted text-ink' : 'text-mute hover:bg-muted/60 hover:text-ink',
            )}
          >
            {v === 'hot' ? 'Popular' : v === 'new' ? 'Newest' : 'Top'}
          </button>
        ))}
        {mine && (
          <Link to="/courses" className="ml-auto text-xs font-semibold text-brand hover:underline">
            Manage courses
          </Link>
        )}
        {!mine && !communityId && (
          <Link
            to="/ask"
            search={{ course: undefined, community: undefined }}
            className="ml-auto rounded-full bg-brand px-3 py-1.5 text-[13px] font-bold text-brand-foreground"
          >
            Ask
          </Link>
        )}
      </div>

      {!mine && !communityId && trending && (
        <Link
          to="/communities/$communityId"
          params={{ communityId: trending.id }}
          className="mx-3 mt-3 block rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40 sm:mx-4"
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-mute">
            <TrendingUp className="h-3.5 w-3.5" />
            Trending community
          </div>
          <h2 className="mt-1 text-[15px] font-bold">c/{trending.slug}</h2>
          <p className="mt-0.5 text-[12px] text-mute">
            {trending.members} members · {trending.participants} active · {trending.posts} posts
          </p>
        </Link>
      )}

      {mine && enrolledCourseIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b px-3 py-2 sm:px-4">
          {courses.data
            ?.filter((c) => enrolledCourseIds.includes(c.id))
            .map((c) => (
              <span key={c.id} className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
                {c.name}
              </span>
            ))}
        </div>
      )}

      {userId && profile && !profile.onboarded && (
        <Link to="/onboarding" className="block border-b px-3 py-3 text-sm font-semibold text-brand sm:px-4">
          Finish your profile →
        </Link>
      )}

      <div>
        {feed.isLoading && <CardSkeleton />}
        {feed.isError && (
          <EmptyState
            title="Couldn't load posts"
            body="Please try again."
            action={
              <Button onClick={() => feed.refetch()} size="sm">
                Try again
              </Button>
            }
          />
        )}
        {!feed.isLoading && feed.data?.length === 0 && (
          <EmptyState
            title={mine && enrolledCourseIds.length === 0 ? 'Your courses start here' : 'No posts yet'}
            body={
              mine && enrolledCourseIds.length === 0
                ? 'Add your courses to see their questions.'
                : 'Be the first to start a conversation.'
            }
            action={
              mine ? (
                <Link to={userId ? '/courses' : '/auth'} className="font-semibold text-brand">
                  {userId ? 'Add courses' : 'Sign in to add courses'}
                </Link>
              ) : undefined
            }
          />
        )}
        {feed.data?.map((q) => (
          <QuestionCard key={q.id} q={q} />
        ))}
      </div>
    </div>
  );
}
