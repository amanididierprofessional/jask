import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { postVotesQuery } from '@/lib/social-queries';
import { cn } from '@/lib/utils';

/** Classic Reddit-style vertical vote widget */
export function PostVote({ id }: { id: string }) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const q = useQuery(postVotesQuery(id));
  const voted = q.data?.some((v) => v.user_id === userId) ?? false;
  const count = q.data?.length ?? 0;

  const vote = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Sign in to upvote');
      const { error } = voted
        ? await supabase.from('question_votes').delete().eq('question_id', id).eq('user_id', userId)
        : await supabase.from('question_votes').insert({ question_id: id, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post-votes', id] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['communities'] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex w-10 shrink-0 flex-col items-center gap-0.5 pt-0.5">
      {/* Upvote */}
      <button
        type="button"
        title="Upvote"
        aria-label={`Upvote (${count})`}
        disabled={vote.isPending}
        onClick={() => vote.mutate()}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-sm transition-colors',
          voted
            ? 'text-[#FF4500] hover:bg-[#FF4500]/10'
            : 'text-[#878A8C] hover:bg-black/5 hover:text-[#FF4500]',
        )}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill={voted ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={voted ? 0 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 4l7 8h-4v8H9v-8H5l7-8z" />
        </svg>
      </button>

      {/* Score */}
      <span
        className={cn(
          'min-w-[1.5ch] text-center text-[12px] font-bold tabular-nums leading-none',
          voted ? 'text-[#FF4500]' : 'text-[#1A1A1B]',
        )}
      >
        {count}
      </span>

      {/* Downvote (placeholder for now) */}
      <button
        type="button"
        title="Downvote (coming soon)"
        aria-label="Downvote"
        disabled
        className="flex h-7 w-7 items-center justify-center rounded-sm text-[#878A8C] opacity-50"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20l-7-8h4V4h6v8h4l-7 8z" />
        </svg>
      </button>
    </div>
  );
}
