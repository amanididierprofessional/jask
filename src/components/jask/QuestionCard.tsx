import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { MessageCircle, Share2, Check, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import type { FeedItem } from '@/lib/queries';
import { timeAgo } from '@/lib/format';
import { Avatar } from './ui';
import { PostVote } from './PostVote';
import { ReferenceItems } from './Attachments';

export function QuestionCard({ q }: { q: FeedItem }) {
  const [expanded, setExpanded] = useState(false);
  const body = q.body?.trim() ?? '';
  const needsTruncate = body.length > 220;
  const shownBody = !needsTruncate || expanded ? body : `${body.slice(0, 220).trimEnd()}…`;

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
    <article className="border-b border-[#EDEFF1] bg-white transition-colors hover:bg-[#F6F7F8]">
      <div className="flex gap-2 px-2 py-2 sm:gap-3 sm:px-3 sm:py-3">
        {/* Left vote column — classic Reddit style */}
        <PostVote id={q.id} />

        {/* Main content */}
        <div className="min-w-0 flex-1 pt-0.5">
          {/* Meta row: community / author / time */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] leading-none text-[#787C7E]">
            {q.course && (
              <>
                <span className="font-semibold text-[#1A1A1B] hover:underline">{q.course.name}</span>
                <span>·</span>
              </>
            )}
            <div className="flex items-center gap-1">
              <Avatar name={q.author?.full_name ?? ''} url={q.author?.avatar_url} size={18} />
              <span className="font-medium text-[#1A1A1B]">{q.author?.full_name ?? 'Student'}</span>
            </div>
            <span>·</span>
            <span>{timeAgo(q.created_at)}</span>
            {q.accepted_answer_id && (
              <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-[#46D160]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#46A302]">
                <Check className="h-3 w-3" /> Solved
              </span>
            )}
          </div>

          {/* Title */}
          <Link
            to="/q/$questionId"
            params={{ questionId: q.id }}
            className="mt-1.5 block text-[16px] font-semibold leading-snug text-[#1A1A1B] hover:text-[#0079D3] sm:text-[18px]"
          >
            {q.title}
          </Link>

          {/* Body preview */}
          {body && (
            <div className="mt-1 text-[14px] leading-relaxed text-[#1A1A1B]/90">
              <p className="whitespace-pre-wrap">{shownBody}</p>
              {needsTruncate && !expanded && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="mt-0.5 text-[13px] font-semibold text-[#0079D3] hover:underline"
                >
                  Read more
                </button>
              )}
            </div>
          )}

          {q.tag && <p className="mt-1.5 text-[12px] font-medium text-[#0079D3]">{q.tag}</p>}

          {/* Media */}
          <ReferenceItems items={q.references ?? []} />

          {/* Action bar — Reddit style */}
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <Link
              to="/q/$questionId"
              params={{ questionId: q.id }}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2 text-[12px] font-bold text-[#878A8C] transition-colors hover:bg-black/5"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
              {q.answer_count ?? 0} Answers
            </Link>

            <button
              type="button"
              onClick={share}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2 text-[12px] font-bold text-[#878A8C] transition-colors hover:bg-black/5"
            >
              <Share2 className="h-4 w-4" strokeWidth={1.75} />
              Share
            </button>

            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2 text-[12px] font-bold text-[#878A8C] transition-colors hover:bg-black/5"
              title="Save (coming soon)"
            >
              <Bookmark className="h-4 w-4" strokeWidth={1.75} />
              Save
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
