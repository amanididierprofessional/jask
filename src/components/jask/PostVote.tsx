import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { postVotesQuery } from '@/lib/social-queries';
import { cn } from '@/lib/utils';

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
    <div className="flex items-center rounded-full border bg-card">
      <button
        type="button"
        title="Upvote"
        aria-label={`Upvote (${count})`}
        disabled={vote.isPending}
        onClick={() => vote.mutate()}
        className={cn(
          'flex h-8 items-center gap-1 rounded-l-full px-2.5 text-sm transition-colors hover:bg-muted',
          voted ? 'text-brand' : 'text-mute',
        )}
      >
        <ArrowUp className={cn('h-4 w-4', voted && 'fill-current')} strokeWidth={2.2} />
        <span className="min-w-[1ch] font-semibold tabular-nums">{count}</span>
      </button>
      <span className="h-5 w-px bg-border" />
      <button
        type="button"
        title="Downvote (coming soon)"
        aria-label="Downvote"
        disabled
        className="flex h-8 items-center rounded-r-full px-2 text-mute opacity-50"
      >
        <ArrowDown className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}
