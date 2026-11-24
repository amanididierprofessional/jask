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
    <div className="bg-white pb-20 md:pb-6">
      {/* Search bar */}
      <div className="sticky top-0 z-10 border-b border-[#EDEFF1] bg-white/95 px-3 py-2 backdrop-blur sm:px-4">
        <div className="flex items-center gap-2 rounded-full border border-[#EDEFF1] bg-[#F6F7F8] px-3 transition-colors focus-within:border-[#0079D3] focus-within:bg-white">
          <Search className="h-4 w-4 shrink-0 text-[#878A8C]" />
          <input
            aria-label="Search questions"
            placeholder="Search questions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#878A8C]"
          />
        </div>
      </div>

      {/* Sort tabs — Reddit style */}
      <div className="flex items-center gap-1 border-b border-[#EDEFF1] px-3 py-1.5 sm:px-4">
        {(['hot', 'new', 'top'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setSort(v)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[13px] font-bold transition-colors',
              sort === v
                ? 'bg-[#F6F7F8] text-[#1A1A1B]'
                : 'text-[#878A8C] hover:bg-[#F6F7F8] hover:text-[#1A1A1B]',
            )}
          >
            {v === 'hot' ? 'Hot' : v === 'new' ? 'New' : 'Top'}
          </button>
        ))}
        {mine && (
          <Link to="/courses" className="ml-auto text-xs font-semibold text-[#0079D3] hover:underline">
            Manage courses
          </Link>
        )}
        {!mine && !communityId && (
          <Link
            to="/ask"
            search={{ course: undefined, community: undefined }}
            className="ml-auto rounded-full bg-[#FF4500] px-3 py-1.5 text-[13px] font-bold text-white hover:bg-[#FF5414]"
          >
            Ask
          </Link>
        )}
      </div>

      {/* Trending community card */}
      {!mine && !communityId && trending && (
        <Link
          to="/communities/$communityId"
          params={{ communityId: trending.id }}
          className="mx-3 mt-3 block rounded-md border border-[#EDEFF1] bg-white p-3 transition-colors hover:bg-[#F6F7F8] sm:mx-4"
        >
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#878A8C]">
            <TrendingUp className="h-3.5 w-3.5" />
            Trending community
          </div>
          <h2 className="mt-1 text-[15px] font-bold text-[#1A1A1B]">c/{trending.slug}</h2>
          <p className="mt-0.5 text-[12px] text-[#787C7E]">
            {trending.members} members · {trending.participants} active · {trending.posts} posts
          </p>
        </Link>
      )}

      {mine && enrolledCourseIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-[#EDEFF1] px-3 py-2 sm:px-4">
          {courses.data
            ?.filter((c) => enrolledCourseIds.includes(c.id))
            .map((c) => (
              <span
                key={c.id}
                className="rounded-full bg-[#0079D3]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0079D3]"
              >
                {c.name}
              </span>
            ))}
        </div>
      )}

      {userId && profile && !profile.onboarded && (
        <Link
          to="/onboarding"
          className="block border-b border-[#EDEFF1] px-3 py-3 text-sm font-semibold text-[#0079D3] sm:px-4"
        >
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
                <Link to={userId ? '/courses' : '/auth'} className="font-semibold text-[#0079D3]">
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
