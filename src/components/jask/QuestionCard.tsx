import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { MessageCircle, Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { FeedItem } from '@/lib/queries';
import { timeAgo } from '@/lib/format';
import { Avatar } from './ui';
import { PostVote } from './PostVote';
import { ReferenceItems } from './Attachments';
import { cn } from '@/lib/utils';

export function QuestionCard({ q }: { q: FeedItem }) {
  const [expanded, setExpanded] = useState(false);
  const body = q.body?.trim() ?? '';
  const needsTruncate = body.length > 180;
  const shownBody = !needsTruncate || expanded ? body : `${body.slice(0, 180).trimEnd()}…`;

  const share = async () => {
    const url = `${window.location.origin}/q/${q.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: q.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      } catch {
        toast.error('Could not share');
      }
    }
  };

  return (
    <article className="border-b transition-colors hover:bg-muted/40">
      <div className="px-3 py-3 sm:px-4">
        {/* Author row — Reddit style */}
        <div className="flex items-center gap-2">
          <Avatar name={q.author?.full_name ?? ''} url={q.author?.avatar_url} size={22} />
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[12px] leading-none">
            <span className="truncate font-semibold text-ink">{q.author?.full_name ?? 'Student'}</span>
            <span className="text-mute">·</span>
            <span className="text-mute">{timeAgo(q.created_at)}</span>
            {q.course && (
              <>
                <span className="text-mute">·</span>
                <span className="truncate text-mute">{q.course.name}</span>
              </>
            )}
            {q.accepted_answer_id && (
              <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-win/15 px-1.5 py-0.5 text-[10px] font-semibold text-win-ink">
                <Check className="h-3 w-3" /> Solved
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <Link
          to="/q/$questionId"
          params={{ questionId: q.id }}
          className="mt-2 block text-[16px] font-bold leading-snug text-ink hover:underline sm:text-[17px]"
        >
          {q.title}
        </Link>

        {/* Body preview with Read more */}
        {body && (
          <div className="mt-1.5 text-[14px] leading-relaxed text-ink/80">
            <p className="whitespace-pre-wrap">{shownBody}</p>
            {needsTruncate && !expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-0.5 text-[13px] font-semibold text-brand hover:underline"
              >
                Read more
              </button>
            )}
          </div>
        )}

        {q.tag && <p className="mt-1.5 text-[12px] font-medium text-brand">{q.tag}</p>}

        {/* Media */}
        <ReferenceItems items={q.references ?? []} />

        {/* Actions — upvote, comments, share */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <PostVote id={q.id} />

          <Link
            to="/q/$questionId"
            params={{ questionId: q.id }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border bg-card px-3 text-[13px] font-semibold text-mute transition-colors hover:bg-muted"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
            {q.answer_count ?? 0}
            <span className="hidden sm:inline">answers</span>
          </Link>

          <button
            type="button"
            onClick={share}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border bg-card px-3 text-[13px] font-semibold text-mute transition-colors hover:bg-muted"
          >
            <Share2 className="h-4 w-4" strokeWidth={1.75} />
            Share
          </button>
        </div>
      </div>
    </article>
  );
}
