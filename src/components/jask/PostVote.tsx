import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { postVotesQuery } from '@/lib/social-queries';
export function PostVote({ id }: { id: string }) {
 const {userId}=useAuth(); const qc=useQueryClient(); const q=useQuery(postVotesQuery(id)); const voted=q.data?.some(v=>v.user_id===userId) ?? false;
 const vote=useMutation({ mutationFn: async()=> { if(!userId) throw new Error('Sign in to upvote and follow this question'); const {error}=voted?await supabase.from('question_votes').delete().eq('question_id',id).eq('user_id',userId):await supabase.from('question_votes').insert({question_id:id,user_id:userId}); if(error) throw error; },onSuccess:()=>{qc.invalidateQueries({queryKey:['post-votes',id]});qc.invalidateQueries({queryKey:['feed']});qc.invalidateQueries({queryKey:['communities']});toast.success(voted?'Unfollowed question':'Upvoted · you’ll be notified when an answer is accepted');},onError:(e)=>toast.error(e.message)});
 return <Button variant={voted?'default':'outline'} size="sm" title="Upvote and follow accepted answers" aria-label={`Upvote question (${q.data?.length ?? 0})`} disabled={vote.isPending} onClick={()=>vote.mutate()}><ArrowUp className="h-4 w-4"/>{q.data?.length ?? 0}</Button>;
}
